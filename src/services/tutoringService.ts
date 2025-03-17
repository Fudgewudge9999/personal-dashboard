import { supabase } from "../integrations/supabase/client";
import { 
  Tables, 
  TablesInsert, 
  TablesUpdate 
} from "../types/supabase-generated";

// Type definitions
export type TutoringStudent = Tables<"tutoring_students">
export type TutoringStudentInsert = TablesInsert<"tutoring_students">
export type TutoringStudentUpdate = TablesUpdate<"tutoring_students">

export type TutoringSession = Tables<"tutoring_sessions">
export type TutoringSessionInsert = TablesInsert<"tutoring_sessions">
export type TutoringSessionUpdate = TablesUpdate<"tutoring_sessions">

export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'paypal' | 'venmo' | 'other'

export type EarningsSummary = {
  period: string;
  totalEarnings: number;
  paidEarnings: number;
  unpaidEarnings: number;
  sessionCount: number;
  totalHours: number;
}

// Error handling helper
const handleError = (error: any): never => {
  console.error("Tutoring service error:", error);
  throw new Error(`Tutoring service error: ${error.message}`);
};

// -------------------------------
// Student CRUD Operations
// -------------------------------

/**
 * Creates a new tutoring student
 */
export const createStudent = async (
  studentData: Omit<TutoringStudentInsert, "user_id">
): Promise<TutoringStudent> => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tutoring_students")
      .insert({ ...studentData, user_id: user.id })
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to create student");

    return data;
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Updates an existing tutoring student
 */
export const updateStudent = async (
  id: string,
  updates: TutoringStudentUpdate
): Promise<TutoringStudent> => {
  try {
    const { data, error } = await supabase
      .from("tutoring_students")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update student");

    return data;
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Deletes a tutoring student
 */
export const deleteStudent = async (id: string): Promise<void> => {
  try {
    // First delete all related sessions (cascade delete not set for flexibility)
    const { error: sessionsError } = await supabase
      .from("tutoring_sessions")
      .delete()
      .eq("student_id", id);
    
    if (sessionsError) throw sessionsError;

    // Then delete the student
    const { error } = await supabase
      .from("tutoring_students")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Gets a single tutoring student by ID
 */
export const getStudentById = async (id: string): Promise<TutoringStudent> => {
  try {
    const { data, error } = await supabase
      .from("tutoring_students")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error("Student not found");
    
    return data;
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Gets all tutoring students for the authenticated user
 */
export const getAllStudents = async (): Promise<TutoringStudent[]> => {
  try {
    const { data, error } = await supabase
      .from("tutoring_students")
      .select("*")
      .order("name");
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    return handleError(error);
  }
};

// -------------------------------
// Session CRUD Operations
// -------------------------------

/**
 * Creates a new tutoring session
 */
export const createSession = async (
  sessionData: Omit<TutoringSessionInsert, "user_id">
): Promise<TutoringSession> => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("User not authenticated");

    // Validate session duration is positive
    if (sessionData.duration_minutes <= 0) {
      throw new Error("Session duration must be greater than 0 minutes");
    }

    // Set total amount to be the same as session rate
    const totalAmount = sessionData.session_rate;

    const { data, error } = await supabase
      .from("tutoring_sessions")
      .insert({
        ...sessionData,
        total_amount: totalAmount,
        user_id: user.id
      })
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to create session");

    return data;
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Updates an existing tutoring session
 */
export const updateSession = async (
  id: string,
  updates: TutoringSessionUpdate
): Promise<TutoringSession> => {
  try {
    // If session rate is updated, update total amount
    if (updates.session_rate !== undefined) {
      updates.total_amount = updates.session_rate;
    }

    const { data, error } = await supabase
      .from("tutoring_sessions")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update session");

    return data;
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Deletes a tutoring session
 */
export const deleteSession = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("tutoring_sessions")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Gets a single tutoring session by ID
 */
export const getSessionById = async (id: string): Promise<TutoringSession> => {
  try {
    const { data, error } = await supabase
      .from("tutoring_sessions")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error("Session not found");
    
    return data;
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Gets all tutoring sessions for the authenticated user
 */
export const getAllSessions = async (): Promise<TutoringSession[]> => {
  try {
    const { data, error } = await supabase
      .from("tutoring_sessions")
      .select("*")
      .order("session_date", { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Gets all sessions for a specific student
 */
export const getSessionsByStudent = async (studentId: string): Promise<TutoringSession[]> => {
  try {
    const { data, error } = await supabase
      .from("tutoring_sessions")
      .select("*")
      .eq("student_id", studentId)
      .order("session_date", { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Marks a session as paid
 */
export const markSessionAsPaid = async (
  id: string, 
  paymentMethod: PaymentMethod,
  paymentDate: string = new Date().toISOString().split('T')[0]
): Promise<TutoringSession> => {
  try {
    const { data, error } = await supabase
      .from("tutoring_sessions")
      .update({
        payment_status: 'paid',
        payment_method: paymentMethod,
        payment_date: paymentDate
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update payment status");

    return data;
  } catch (error) {
    return handleError(error);
  }
};

// -------------------------------
// Analytics Operations
// -------------------------------

/**
 * Gets all sessions within a date range
 */
export const getSessionsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<TutoringSession[]> => {
  try {
    const { data, error } = await supabase
      .from("tutoring_sessions")
      .select("*")
      .gte("session_date", startDate)
      .lte("session_date", endDate)
      .order("session_date");
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Calculates earnings summary for the current week
 */
export const getCurrentWeekEarnings = async (): Promise<EarningsSummary> => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
  endOfWeek.setHours(23, 59, 59, 999);

  return getEarningsSummary(
    startOfWeek.toISOString().split('T')[0],
    endOfWeek.toISOString().split('T')[0],
    'Current Week'
  );
};

/**
 * Calculates earnings summary for the current month
 */
export const getCurrentMonthEarnings = async (): Promise<EarningsSummary> => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return getEarningsSummary(
    startOfMonth.toISOString().split('T')[0],
    endOfMonth.toISOString().split('T')[0],
    'Current Month'
  );
};

/**
 * Calculates earnings for a custom date range
 */
export const getEarningsSummary = async (
  startDate: string,
  endDate: string,
  periodLabel: string = 'Custom Period'
): Promise<EarningsSummary> => {
  try {
    const sessions = await getSessionsByDateRange(startDate, endDate);
    
    const totalEarnings = sessions.reduce((sum, session) => sum + Number(session.total_amount), 0);
    const paidEarnings = sessions
      .filter(session => session.payment_status === 'paid')
      .reduce((sum, session) => sum + Number(session.total_amount), 0);
    const unpaidEarnings = totalEarnings - paidEarnings;
    const totalHours = sessions.reduce((sum, session) => sum + (session.duration_minutes / 60), 0);

    return {
      period: periodLabel,
      totalEarnings,
      paidEarnings,
      unpaidEarnings,
      sessionCount: sessions.length,
      totalHours
    };
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Gets a monthly summary of earnings for the specified year
 */
export const getYearlyEarningsSummary = async (year: number): Promise<EarningsSummary[]> => {
  try {
    const summaries: EarningsSummary[] = [];
    
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];
      const monthName = startOfMonth.toLocaleString('default', { month: 'long' });
      
      const summary = await getEarningsSummary(startDate, endDate, monthName);
      summaries.push(summary);
    }
    
    return summaries;
  } catch (error) {
    return handleError(error);
  }
}; 