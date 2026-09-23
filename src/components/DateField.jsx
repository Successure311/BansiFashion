import { forwardRef } from "react";
import DatePicker from "react-datepicker";

// A <button>, not a text <input>: it can be clicked/focused to open the
// calendar like a normal date field, but since it's not an editable text
// field, mobile browsers never raise the on-screen keyboard for it.
const DateButton = forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    ref={ref}
    onClick={onClick}
    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-left bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
  >
    {value}
  </button>
));
DateButton.displayName = "DateButton";

export default function DateField({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
      <DatePicker
        selected={value}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        withPortal
        customInput={<DateButton />}
        calendarClassName="!font-sans"
        wrapperClassName="w-full"
      />
    </div>
  );
}
