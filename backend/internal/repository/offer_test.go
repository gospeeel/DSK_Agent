package repository

import "testing"

func TestDecimalMoneyToIntegerUsesHalfUpRubles(t *testing.T) {
	tests := map[string]int64{
		"14200000.00": 14200000,
		"100.49":      100,
		"100.50":      101,
		"100.99":      101,
	}
	for input, want := range tests {
		got, err := decimalMoneyToInteger(input)
		if err != nil || got != want {
			t.Fatalf("decimalMoneyToInteger(%q)=%d,%v want %d", input, got, err, want)
		}
	}
}

func TestDecimalMoneyToIntegerRejectsInvalidValue(t *testing.T) {
	if _, err := decimalMoneyToInteger("not-money"); err == nil {
		t.Fatal("expected invalid decimal error")
	}
}
