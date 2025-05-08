import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Health data functions
export const saveHealthData = async (userId, healthData) => {
  try {
    const { data, error } = await supabase
      .from('health_data')
      .insert({
        user_id: userId,
        heart_rate: healthData.heartRate,
        spo2: healthData.spo2,
        air_quality: healthData.airQuality,
        // Add other health metrics as needed
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving health data:', error)
    throw error
  }
}

export const getHealthDataForUser = async (userId, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching health data:', error)
    throw error
  }
}