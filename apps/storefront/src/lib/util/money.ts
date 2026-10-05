import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-IN",
}: ConvertToLocaleParams) => {
  // ₹1,499 rather than ₹1,499.00 — paise only when there are any.
  const whole = Number.isInteger(amount)
  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency_code,
        minimumFractionDigits: minimumFractionDigits ?? (whole ? 0 : 2),
        maximumFractionDigits: maximumFractionDigits ?? (whole ? 0 : 2),
      }).format(amount)
    : amount.toString()
}
