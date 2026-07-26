import { Redirect } from 'expo-router';

/** Stack route kept for old links — ranks live in the tab bar now. */
export default function LeaderboardRedirect() {
  return <Redirect href="/(tabs)/leaderboard" />;
}
