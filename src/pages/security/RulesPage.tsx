import { PageHeader } from '../../components/PageHeader';
import { SafetyRulesPoster } from '../../components/SafetyRulesPoster';

export function RulesPage() {
  return (
    <div className="min-h-full pb-28">
      <PageHeader title="Nội quy an toàn" subtitle="Áp dụng cho mọi xe và người ra vào kho" />
      <div className="-mt-2 px-4">
        <SafetyRulesPoster />
      </div>
    </div>
  );
}
