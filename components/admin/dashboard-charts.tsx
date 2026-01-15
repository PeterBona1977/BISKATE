"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Line,
  LineChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Dados de exemplo - em produção, estes viriam da API
const userGrowthData = [
  { month: "Jan", users: 120 },
  { month: "Fev", users: 150 },
  { month: "Mar", users: 200 },
  { month: "Abr", users: 220 },
  { month: "Mai", users: 300 },
  { month: "Jun", users: 350 },
]

const gigsByStatusData = [
  { name: "Ativos", value: 45 },
  { name: "Pendentes", value: 20 },
  { name: "Fechados", value: 30 },
  { name: "Suspensos", value: 5 },
]

const responsesByMonthData = [
  { month: "Jan", responses: 80 },
  { month: "Fev", responses: 100 },
  { month: "Mar", responses: 130 },
  { month: "Abr", responses: 170 },
  { month: "Mai", responses: 190 },
  { month: "Jun", responses: 220 },
]

const COLORS = ["#0088FE", "#FFBB28", "#FF8042", "#FF0000"]

export function DashboardCharts() {
  const [activeTab, setActiveTab] = useState("users")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Análise de Dados</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Utilizadores</TabsTrigger>
            <TabsTrigger value="gigs">Biskates</TabsTrigger>
            <TabsTrigger value="responses">Respostas</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="h-[400px]">
              <ChartContainer
                config={{
                  users: {
                    label: "Utilizadores",
                    color: "hsl(var(--chart-1))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="var(--color-users)"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </TabsContent>

          <TabsContent value="gigs" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gigsByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {gigsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} biskates`, "Quantidade"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            <div className="h-[400px]">
              <ChartContainer
                config={{
                  responses: {
                    label: "Respostas",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={responsesByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="responses" fill="var(--color-responses)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
