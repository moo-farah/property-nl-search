export function monthlyFromAnnualAed(annualAed: number): number {
    return Math.round(annualAed / 12);
}

export function formatAed(amount: number): string {
    return amount.toLocaleString("en-AE");
}
