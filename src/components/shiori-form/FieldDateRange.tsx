interface FieldDateRangeProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  startDateError?: string;
  endDateError?: string;
  disabled?: boolean;
}

/**
 * S2 FieldDateRange(日程・必須)。参照: docs/design/screens/S2_しおり作成.md
 *
 * 開始日・終了日は幅にかかわらず常に横並びにする(オーナー指示: 作成画面を少しコンパクトに)。
 * 375px幅でも2列に収まるよう、日付入力は`px-2.5`・`text-[15px]`に詰めている。
 */
export function FieldDateRange({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startDateError,
  endDateError,
  disabled,
}: FieldDateRangeProps) {
  return (
    <div>
      <p className="mb-1.5 block px-0.5 text-[13px] font-bold text-ink-label">日程 ※必須</p>
      <div className="flex flex-row items-start gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="shiori-start-date" className="mb-1 block px-0.5 text-xs font-medium text-ink-muted">
            開始日
          </label>
          <input
            id="shiori-start-date"
            type="date"
            value={startDate}
            disabled={disabled}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={`min-h-11 w-full rounded-xl border-[1.5px] bg-white px-2.5 text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-faint ${
              startDateError ? "border-red-400" : "border-paper-dashed focus:border-sakura-field"
            }`}
          />
          {startDateError && <p className="mt-1 px-0.5 text-xs font-medium text-red-600">{startDateError}</p>}
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="shiori-end-date" className="mb-1 block px-0.5 text-xs font-medium text-ink-muted">
            終了日
          </label>
          <input
            id="shiori-end-date"
            type="date"
            value={endDate}
            disabled={disabled}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={`min-h-11 w-full rounded-xl border-[1.5px] bg-white px-2.5 text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-faint ${
              endDateError ? "border-red-400" : "border-paper-dashed focus:border-sakura-field"
            }`}
          />
          {endDateError && <p className="mt-1 px-0.5 text-xs font-medium text-red-600">{endDateError}</p>}
        </div>
      </div>
    </div>
  );
}
