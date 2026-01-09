import { createClient } from "@supabase/supabase-js";
import process from "process";

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

export const domainToken = async (domain: string) => {
  const { data, error } = await supabase
    .from("mailcow")
    .select("token")
    .eq("domain", domain)
    .single();
  return data?.token;
};
