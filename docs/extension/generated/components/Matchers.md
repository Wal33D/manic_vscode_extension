# Matchers

## Methods

### `toBe(expected)`

**Parameters:**

- `expected` (`E`): 

**Returns:** `R`

### `toBeCloseTo(expected, numDigits?)`

**Parameters:**

- `expected` (`number`): 
- `numDigits` (`number | undefined`): 

**Returns:** `R`

### `toBeDefined()`

**Returns:** `R`

### `toBeFalsy()`

**Returns:** `R`

### `toBeGreaterThan(expected)`

**Parameters:**

- `expected` (`number | bigint`): 

**Returns:** `R`

### `toBeGreaterThanOrEqual(expected)`

**Parameters:**

- `expected` (`number | bigint`): 

**Returns:** `R`

### `toBeInstanceOf(expected)`

**Parameters:**

- `expected` (`E`): 

**Returns:** `R`

### `toBeLessThan(expected)`

**Parameters:**

- `expected` (`number | bigint`): 

**Returns:** `R`

### `toBeLessThanOrEqual(expected)`

**Parameters:**

- `expected` (`number | bigint`): 

**Returns:** `R`

### `toBeNull()`

**Returns:** `R`

### `toBeTruthy()`

**Returns:** `R`

### `toBeUndefined()`

**Returns:** `R`

### `toBeNaN()`

**Returns:** `R`

### `toContain(expected)`

**Parameters:**

- `expected` (`E`): 

**Returns:** `R`

### `toContainEqual(expected)`

**Parameters:**

- `expected` (`E`): 

**Returns:** `R`

### `toEqual(expected)`

**Parameters:**

- `expected` (`E`): 

**Returns:** `R`

### `toHaveBeenCalled()`

**Returns:** `R`

### `toHaveBeenCalledTimes(expected)`

**Parameters:**

- `expected` (`number`): 

**Returns:** `R`

### `toHaveBeenCalledWith(params)`

**Parameters:**

- `params` (`E`): 

**Returns:** `R`

### `toHaveBeenNthCalledWith(nthCall, params)`

**Parameters:**

- `nthCall` (`number`): 
- `params` (`E`): 

**Returns:** `R`

### `toHaveBeenLastCalledWith(params)`

**Parameters:**

- `params` (`E`): 

**Returns:** `R`

### `toHaveLastReturnedWith(expected?)`

**Parameters:**

- `expected` (`E | undefined`): 

**Returns:** `R`

### `toHaveLength(expected)`

**Parameters:**

- `expected` (`number`): 

**Returns:** `R`

### `toHaveNthReturnedWith(nthCall, expected?)`

**Parameters:**

- `nthCall` (`number`): 
- `expected` (`E | undefined`): 

**Returns:** `R`

### `toHaveProperty(propertyPath, value?)`

**Parameters:**

- `propertyPath` (`string | readonly any[]`): 
- `value` (`E | undefined`): 

**Returns:** `R`

### `toHaveReturned()`

**Returns:** `R`

### `toHaveReturnedTimes(expected)`

**Parameters:**

- `expected` (`number`): 

**Returns:** `R`

### `toHaveReturnedWith(expected?)`

**Parameters:**

- `expected` (`E | undefined`): 

**Returns:** `R`

### `toMatch(expected)`

**Parameters:**

- `expected` (`string | RegExp`): 

**Returns:** `R`

### `toMatchObject(expected)`

**Parameters:**

- `expected` (`E`): 

**Returns:** `R`

### `toMatchSnapshot(propertyMatchers, snapshotName?)`

**Parameters:**

- `propertyMatchers` (`Partial<U>`): 
- `snapshotName` (`string | undefined`): 

**Returns:** `R`

### `toMatchInlineSnapshot(propertyMatchers, snapshot?)`

**Parameters:**

- `propertyMatchers` (`Partial<U>`): 
- `snapshot` (`string | undefined`): 

**Returns:** `R`

### `toStrictEqual(expected)`

**Parameters:**

- `expected` (`E`): 

**Returns:** `R`

### `toThrow(error?)`

**Parameters:**

- `error` (`string | RegExp | Constructable | Error | undefined`): 

**Returns:** `R`

### `toThrowErrorMatchingSnapshot(snapshotName?)`

**Parameters:**

- `snapshotName` (`string | undefined`): 

**Returns:** `R`

### `toThrowErrorMatchingInlineSnapshot(snapshot?)`

**Parameters:**

- `snapshot` (`string | undefined`): 

**Returns:** `R`

### `toBeWithinRange(floor, ceiling)`

**Parameters:**

- `floor` (`number`): 
- `ceiling` (`number`): 

**Returns:** `R`

### `toContainObject(expected)`

**Parameters:**

- `expected` (`any`): 

**Returns:** `R`

### `toHaveBeenCalledWithMatch(expected)`

**Parameters:**

- `expected` (`any`): 

**Returns:** `R`

