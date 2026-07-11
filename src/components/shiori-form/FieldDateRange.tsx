interface FieldDateRangeProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  startDateError?: string;
  endDateError?: string;
  disabled?: boolean;
}

/** S2 FieldDateRange(日程・必須)。参照: docs/design/screens/S2_しおり作成.md */
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
      <p className="mb-1 text-sm font-semibold text-neutral-900">日程 ※必須</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="shiori-start-date" className="mb-1 block text-sm text-neutral-500">
            開始日
          </label>
          <input
            id="shiori-start-date"
            type="date"
            value={startDate}
            disabled={disabled}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={`h-11 w-full rounded-lg border bg-white px-3 text-base text-neutral-900 ${
              startDateError ? "border-red-400" : "border-neutral-200"
            }`}
          />
          {startDateError && <p className="mt-1 text-xs text-red-600">{startDateError}</p>}
        </div>
        <div className="flex-1">
          <label htmlFor="shiori-end-date" className="mb-1 block text-sm text-neutral-500">
            終了日
          </label>
          <input
            id="shiori-end-date"
            type="date"
            value={endDate}
            disabled={disabled}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={`h-11 w-full rounded-lg border bg-white px-3 text-base text-neutral-900 ${
              endDateError ? "border-red-400" : "border-neutral-200"
            }`}
          />
          {endDateError && <p className="mt-1 text-xs text-red-600">{endDateError}</p>}
        </div>
      </div>
    </div>
  );
}
