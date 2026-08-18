import type { JobFormValue } from '@/components/JobFormFields';

// jobs テーブルへ保存するとき、カラムを3段階に分けて扱う。
// マイグレーション未実行の環境では後ろの塊から順に落として再試行できるようにするため。
//   base   … 初期から存在するカラム
//   extras … 2026-07-14 で追加した募集要項の詳細
//   custom … 2026-08-18 で追加したカスタム項目
export function splitJobPayload(form: JobFormValue) {
  const base = {
    job_title: form.job_title.trim(),
    salary: form.salary.trim(),
    location: form.location.trim(),
    job_description: form.job_description,
    job_categories: form.job_categories,
    work_days: form.work_days,
    work_conditions: form.work_conditions,
    job_features: form.job_features,
    // 「応募要件」は必須条件に一本化したのでフォームから外したが、
    // 旧カラムが NOT NULL の環境でも通るよう空文字を入れておく
    requirements: '',
  };

  const extraEntries: [string, string | string[]][] = [
    ['required_conditions', form.required_conditions],
    ['welcome_conditions', form.welcome_conditions],
    ['ideal_candidate', form.ideal_candidate],
    ['shift_info', form.shift_info],
    ['employment_type', form.employment_type],
    ['address', form.address],
    ['selection_process', form.selection_process],
    ['training', form.training],
    ['benefits', form.benefits],
    ['alumni_placements', form.alumni_placements],
    ['intern_count', form.intern_count],
    ['feature_tags', form.feature_tags],
  ];
  const extras = Object.fromEntries(extraEntries);

  return { base, extras, custom: { custom_fields: form.custom_fields } };
}
