/** Color estable y distintivo por sesión (para diferenciar los códigos del plan). */
const PALETTE = ['#E5484D', '#3E63DD', '#8E4EC6', '#C2620B', '#0E7C9B', '#3E9B4F', '#E5670B', '#D4419E']

export function sessionColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 31) % 99991
  return PALETTE[h % PALETTE.length]
}
