import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that two form fields have the same value.
 * @param field1 The name of the first field
 * @param field2 The name of the second field
 * @param errorKey The error key to display if the values do not match
 * @returns ValidatorFn
 */
export const matchValidator = (
  field1: string,
  field2: string,
  errorKey: string
): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value1 = control.get(field1)?.value;
    const value2Control = control.get(field2);

    if (!value1 || !value2Control) return null;

    if (value1 !== value2Control.value) {
      value2Control.setErrors({ [errorKey]: true });
      return { [errorKey]: true };
    } else {
      if (value2Control.hasError(errorKey)) {
        value2Control.setErrors(null);
      }
      return null;
    }
  };
}
