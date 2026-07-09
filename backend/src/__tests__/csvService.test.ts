import { parseCSV, getCSVHeaders, batchRecords } from '../services/csvService';

describe('parseCSV', () => {
  it('should parse a simple CSV string into records', () => {
    const csv = 'name,email,phone\nJohn Doe,john@test.com,9876543210\nJane,jane@test.com,1234567890';
    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('John Doe');
    expect(result[0].email).toBe('john@test.com');
    expect(result[1].name).toBe('Jane');
  });

  it('should handle CSV with extra whitespace', () => {
    const csv = ' name , email \n  Alice ,  alice@test.com ';
    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
    expect(result[0].email).toBe('alice@test.com');
  });

  it('should handle CSV with quoted fields containing commas', () => {
    const csv = 'name,company,email\n"Smith, John","Acme, Inc.",john@acme.com';
    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Smith, John');
    expect(result[0].company).toBe('Acme, Inc.');
  });

  it('should skip empty lines', () => {
    const csv = 'name,email\nAlice,alice@test.com\n\nBob,bob@test.com';
    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
  });

  it('should return empty array for header-only CSV', () => {
    const csv = 'name,email,phone';
    const result = parseCSV(csv);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty string input', () => {
    const result = parseCSV('');
    expect(result).toHaveLength(0);
  });

  it('should handle CSV with inconsistent column counts', () => {
    const csv = 'name,email,phone\nAlice,alice@test.com\nBob,bob@test.com,1234567890';
    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
    expect(result[0].email).toBe('alice@test.com');
  });
});

describe('getCSVHeaders', () => {
  it('should return headers from a CSV string', () => {
    const csv = 'name,email,phone\nJohn,john@test.com,123';
    const headers = getCSVHeaders(csv);

    expect(headers).toEqual(['name', 'email', 'phone']);
  });

  it('should trim header whitespace', () => {
    const csv = ' name , email , phone \nJohn,john@test.com,123';
    const headers = getCSVHeaders(csv);

    expect(headers).toEqual(['name', 'email', 'phone']);
  });

  it('should return empty array for empty input', () => {
    const result = getCSVHeaders('');
    expect(result).toEqual([]);
  });
});

describe('batchRecords', () => {
  it('should split records into batches of given size', () => {
    const records = [1, 2, 3, 4, 5, 6, 7];
    const batches = batchRecords(records, 3);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toEqual([1, 2, 3]);
    expect(batches[1]).toEqual([4, 5, 6]);
    expect(batches[2]).toEqual([7]);
  });

  it('should use default batch size of 10', () => {
    const records = Array.from({ length: 25 }, (_, i) => i);
    const batches = batchRecords(records);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(10);
    expect(batches[1]).toHaveLength(10);
    expect(batches[2]).toHaveLength(5);
  });

  it('should return single batch when records are fewer than batch size', () => {
    const records = [1, 2, 3];
    const batches = batchRecords(records, 10);

    expect(batches).toHaveLength(1);
    expect(batches[0]).toEqual([1, 2, 3]);
  });

  it('should return empty array for empty input', () => {
    const batches = batchRecords([], 5);
    expect(batches).toHaveLength(0);
  });

  it('should handle batch size of 1', () => {
    const records = ['a', 'b', 'c'];
    const batches = batchRecords(records, 1);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toEqual(['a']);
    expect(batches[1]).toEqual(['b']);
    expect(batches[2]).toEqual(['c']);
  });
});
