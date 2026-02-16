"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateOrgSchema = z.object({
    legalName: z.string().min(2, "Nome legal deve ter pelo menos 2 caracteres"),
    vatNumber: z.string().min(5, "NIF deve ter pelo menos 5 caracteres"),
    address: z.string().min(5, "Morada deve ter pelo menos 5 caracteres"),
    registryCode: z.string().min(3, "Código da certidão é obrigatório"),
});

export type CreateOrgState = {
    errors?: {
        legalName?: string[];
        vatNumber?: string[];
        address?: string[];
        registryCode?: string[];
        _form?: string[];
    };
    message?: string;
    success?: boolean;
    orgId?: string;
};

export async function createOrganizationAction(
    prevState: CreateOrgState,
    formData: FormData
): Promise<CreateOrgState> {
    const validatedFields = CreateOrgSchema.safeParse({
        legalName: formData.get("legalName"),
        vatNumber: formData.get("vatNumber"),
        address: formData.get("address"),
        registryCode: formData.get("registryCode"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Erro de validação.",
        };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { message: "Deve estar autenticado para criar uma organização." };
    }

    // 1. Create Organization
    const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
            legal_name: validatedFields.data.legalName,
            vat_number: validatedFields.data.vatNumber,
            address: validatedFields.data.address,
            registry_code: validatedFields.data.registryCode,
        })
        .select()
        .single();

    if (orgError) {
        console.error("Create Org Error:", orgError);
        return { message: "Erro ao criar organização: " + orgError.message };
    }

    // 2. Create Organization Member (Owner)
    const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
            organization_id: orgData.id,
            user_id: user.id,
            role: 'owner'
        });

    if (memberError) {
        console.error("Create Org Member Error:", memberError);
        // Cleanup org if member creation fails? 
        // Ideally use a transaction if possible, but for now we report error
        return { message: "Erro ao associar utilizador à organização: " + memberError.message };
    }

    revalidatePath("/dashboard");

    return { success: true, message: "Organização criada com sucesso!", orgId: orgData.id };
}
