import { toScreamingSnakeCase } from './action-type-name';

describe('toScreamingSnakeCase', () => {
  it('splits camelCase on each lower-to-upper boundary', () => {
    expect(toScreamingSnakeCase('loadFailure')).toBe('LOAD_FAILURE');
    expect(toScreamingSnakeCase('getAllTasks')).toBe('GET_ALL_TASKS');
  });

  it('uppercases a name that has no boundary', () => {
    expect(toScreamingSnakeCase('request')).toBe('REQUEST');
    expect(toScreamingSnakeCase('')).toBe('');
  });

  it('keeps an acronym whole instead of splitting every capital', () => {
    expect(toScreamingSnakeCase('loadHTTPResponse')).toBe('LOAD_HTTPRESPONSE');
    expect(toScreamingSnakeCase('HTTPError')).toBe('HTTPERROR');
    expect(toScreamingSnakeCase('XMLHttpRequest')).toBe('XMLHTTP_REQUEST');
  });

  it('does not treat a digit as a boundary', () => {
    expect(toScreamingSnakeCase('parseURL2Value')).toBe('PARSE_URL2VALUE');
  });
});
