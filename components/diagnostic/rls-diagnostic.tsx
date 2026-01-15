"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface DiagnosticResult {
  table: string
  exists: boolean
  hasRLS: boolean
  policyCount: number
  canRead: boolean
  canWrite: boolean
  error?: string
  responseTime?: number
}

interface SystemStats {
  total_users: number
  total_profiles: number
  total_gigs: number
  rls_enabled: boolean
}

export function RLSDiagnostic() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [fixing, setFixing] = useState(false)
  const [fixResult, setFixResult] = useState<string | null>(null)

  const tables = ["profiles", "gigs", "responses", "notifications", "user_preferences"]

  const runDiagnostic = async () => {
    setLoading(true)
    setResults([])
    setSystemStats(null)

    const diagnosticResults: DiagnosticResult[] = []

    // Test system stats first
    try {
      const startTime = Date.now()
      const { data: stats, error: statsError } = await supabase.rpc("get_system_stats")
      const responseTime = Date.now() - startTime

      if (!statsError && stats) {
        setSystemStats(stats)
        console.log("System stats retrieved:", stats)
      } else {
        console.error("System stats error:", statsError)
      }
    } catch (err) {
      console.error("System stats exception:", err)
    }

    // Test each table
    for (const table of tables) {
      const startTime = Date.now()
      const result: DiagnosticResult = {
        table,
        exists: false,
        hasRLS: false,
        policyCount: 0,
        canRead: false,
        canWrite: false,
        responseTime: 0,
      }

      try {
        // Test if table exists and is accessible
        const { data, error: selectError } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .limit(1)

        result.responseTime = Date.now() - startTime

        if (selectError) {
          result.error = selectError.message
          if (selectError.message.includes("does not exist")) {
            result.exists = false
          } else {
            result.exists = true
            if (selectError.message.includes("recursion")) {
              result.error = "RLS Recursion Error"
            }
          }
        } else {
          result.exists = true
          result.canRead = true
        }

        // Check RLS status
        if (result.exists) {
          try {
            const { data: rlsData, error: rlsError } = await supabase.rpc("check_rls_status", {
              table_name: table,
            })

            if (!rlsError) {
              result.hasRLS = rlsData || false
            }
          } catch (rlsErr) {
            console.log(`RLS check failed for ${table}:`, rlsErr)
          }

          // Count policies (if accessible)
          try {
            const { data: policies, error: policiesError } = await supabase
              .from("pg_policies")
              .select("policyname")
              .eq("tablename", table)

            if (!policiesError && policies) {
              result.policyCount = policies.length
            }
          } catch (policiesErr) {
            console.log(`Policy count failed for ${table}:`, policiesErr)
          }

          // Test write access (only for profiles)
          if (table === "profiles" && result.canRead) {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser()
              if (user) {
                const { error: writeError } = await supabase.from(table).upsert(
                  {
                    id: user.id,
                    email: user.email,
                    full_name: "Test User",
                    role: "client",
                  },
                  { onConflict: "id" },
                )

                result.canWrite = !writeError
                if (writeError && !result.error) {
                  result.error = writeError.message
                }
              }
            } catch (writeErr) {
              console.log(`Write test failed for ${table}:`, writeErr)
            }
          }
        }
      } catch (err) {
        result.error = err instanceof Error ? err.message : "Unknown error"
        result.responseTime = Date.now() - startTime
      }

      diagnosticResults.push(result)
    }

    setResults(diagnosticResults)
    setLoading(false)
  }

  const fixRLSIssues = async () => {
    setFixing(true)
    setFixResult(null)

    try {
      console.log("Attempting to fix RLS issues...")

      // Try to execute the fix script via RPC
      const { data, error } = await supabase.rpc("execute_sql", {
        sql: `
          -- Disable RLS temporarily
          ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
          
          -- Drop all existing policies
          DO $$
          DECLARE
              pol RECORD;
          BEGIN
              FOR pol IN 
                  SELECT policyname 
                  FROM pg_policies 
                  WHERE tablename = 'profiles'
              LOOP
                  EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
              END LOOP;
          END $$;
          
          -- Re-enable RLS
          ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
          
          -- Create simple policies
          CREATE POLICY "profiles_select_simple" ON profiles FOR SELECT USING (true);
          CREATE POLICY "profiles_insert_simple" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
          CREATE POLICY "profiles_update_simple" ON profiles FOR UPDATE USING (auth.uid() = id);
          
          SELECT 'RLS fixed successfully' as result;
        `,
      })

      if (error) {
        setFixResult(`Error: ${error.message}`)
        console.error("RLS fix error:", error)
      } else {
        setFixResult("RLS policies fixed successfully! Please refresh to see changes.")
        console.log("RLS fix successful:", data)

        // Re-run diagnostic after a delay
        setTimeout(() => {
          runDiagnostic()
        }, 2000)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setFixResult(`Exception: ${errorMessage}`)
      console.error("RLS fix exception:", err)
    } finally {
      setFixing(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const getStatusBadge = (result: DiagnosticResult) => {
    if (!result.exists) {
      return <Badge variant="secondary">Not Found</Badge>
    }
    if (result.error?.includes("recursion")) {
      return <Badge variant="destructive">Recursion Error</Badge>
    }
    if (result.error) {
      return <Badge variant="destructive">Error</Badge>
    }
    if (result.canRead) {
      return <Badge variant="default">OK</Badge>
    }
    return <Badge variant="secondary">No Access</Badge>
  }

  const getStatusIcon = (result: DiagnosticResult) => {
    if (!result.exists) {
      return <XCircle className="h-4 w-4 text-gray-400" />
    }
    if (result.error?.includes("recursion")) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
    if (result.error) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    if (result.canRead) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RLS Diagnostic</h2>
          <p className="text-muted-foreground">Check and fix Row Level Security issues</p>
        </div>
        <div className="space-x-2">
          <Button onClick={runDiagnostic} disabled={loading} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={fixRLSIssues} disabled={fixing} variant="default">
            {fixing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
            Fix RLS Issues
          </Button>
        </div>
      </div>

      {fixResult && (
        <Alert variant={fixResult.includes("Error") || fixResult.includes("Exception") ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{fixResult}</AlertDescription>
        </Alert>
      )}

      {/* System Stats */}
      {systemStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{systemStats.total_users}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemStats.total_profiles}</div>
                <div className="text-sm text-muted-foreground">Profiles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemStats.total_gigs}</div>
                <div className="text-sm text-muted-foreground">Gigs</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {systemStats.rls_enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">RLS</span>
                </div>
                <div className="text-sm text-muted-foreground">{systemStats.rls_enabled ? "Enabled" : "Disabled"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Diagnostics */}
      <div className="grid gap-4">
        {results.map((result) => (
          <Card key={result.table}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 capitalize">
                  {getStatusIcon(result)}
                  {result.table}
                </CardTitle>
                {getStatusBadge(result)}
              </div>
              <CardDescription>
                {result.exists ? (
                  <>
                    RLS: {result.hasRLS ? "Enabled" : "Disabled"} • Policies: {result.policyCount} • Response:{" "}
                    {result.responseTime}ms
                  </>
                ) : (
                  "Table not found or not accessible"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    {result.canRead ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Read Access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.canWrite ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span>Write Access</span>
                  </div>
                </div>

                {result.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
