import { useMyRunner } from '../../context/MyRunnerContext'
import type { Tables } from '../../types/supabase'
import { supabase } from '../api/supabase'

type Runner = Tables<'runners'>
type Connection = Tables<'run_connections'>

export const useRunnerActions = () => {
  const { myRunner } = useMyRunner()

  const blockRunner = async (runner: Runner, connection: Connection | null) => {
    if (!myRunner) throw new Error('No runner profile')
    const { error: blockErr } = await supabase
      .from('user_blocks')
      .insert({ blocker_runner_id: myRunner.id, blocked_runner_id: runner.id })
    if (blockErr) throw blockErr
    if (connection) {
      const { error: connErr } = await supabase
        .from('run_connections')
        .delete()
        .eq('id', connection.id)
      if (connErr) throw connErr
    }
  }

  const reportRunner = async (
    runner: Runner,
    connection: Connection | null,
    reason: string,
  ) => {
    if (!myRunner) return
    await supabase.from('user_reports').insert({
      reporter_runner_id: myRunner.id,
      reported_runner_id: runner.id,
      reason,
    })
    if (connection) {
      await supabase.from('run_connections').delete().eq('id', connection.id)
    }
  }

  return { blockRunner, reportRunner }
}
