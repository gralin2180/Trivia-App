import { ProgressBar } from '@/components/ui/ProgressBar';
import { gradients } from '@/constants/theme';

type Props = {
  progress: number;
  height?: number;
};

export function XPBar({ progress, height = 12 }: Props) {
  return <ProgressBar progress={progress} height={height} gradient={gradients.xp} />;
}
