# Conventions

## Development

Build, run, observe output, evaluate, improve, repeat. Every change should be verified by running the code and reading its output. Use `npm run validate` before committing.

## Architecture

Two concepts: functions and a runtime.

Functions are pure, self-contained units of logic. The runtime is the boundary between functions and the real world. `main.ts` wires them together.

This architecture is designed for AI agents that start every session with zero context. Every decision optimizes for:

- Nothing hidden: An agent reading a function sees every dependency in the parameter list. No implicit imports, no global state, no side effects that aren't passed in.
- Every file self-contained: An agent can understand any function by reading one file. No tracing import chains across the codebase.
- Testable in isolation: Any function can be called with inputs and its outputs inspected. The whole system doesn't need to run to test a part.
- Fearless modification: Functions don't know about each other. Changing or deleting one cannot break another. Only `main.ts` knows how things connect.

## Style

- Template literals (backticks) for strings in code
- Double quotes for imports: `import type { Amount } from "../types/Amount";`
- Semicolons at end of statements
- Arrow functions only, never the `function` keyword
- `const` only, no `let` or `var`
- Declare things above where they are used (no hoisting)
- camelCase for functions, files in `functions/`, `steps/`, and `runtime/`
- PascalCase for types and files in `types/`

## File Structure

```
project/
  functions/    # flat folder of function files
  steps/        # flat folder of step files (state routing)
  types/        # flat folder of type files
  tests/        # test files
  runtime/      # one file per external service
  scripts/      # tooling (validation, etc.)
  data/         # static data, config, assets
  main.ts       # entry point: imports + one expression tree
```

No subfolders inside `functions/`, `steps/`, or `types/`. Everything is flat.

## Function Files

Every file in `functions/`:

- Exports exactly one `const` arrow function
- File name matches export name exactly
- Has zero runtime imports from other project files (`import type` from `types/` is allowed)
- Receives all dependencies as parameters (capabilities and data, flat)
- Never takes a state type as a parameter (state routing belongs in `steps/`)
- Has no global state, no side effects beyond passed-in capabilities
- Uses `const` arrow functions only, never the `function` keyword
- Declares things above where they are used (no hoisting)

```typescript
// calculateTax.ts
import type { Amount } from "../types/Amount";
import type { TaxRate } from "../types/TaxRate";

export const calculateTax = (amount: Amount, taxRate: TaxRate) => {
  return amount * taxRate;
};
```

Functions that need I/O receive capabilities as parameters. A capability is a function provided by the runtime that performs side effects (database queries, network requests, email, etc.):

```typescript
// lookupCustomer.ts
import type { QueryFn } from "../types/QueryFn";
import type { CustomerId } from "../types/CustomerId";

export const lookupCustomer = (query: QueryFn, id: CustomerId) => {
  return query(`SELECT * FROM customers WHERE id = ${id}`);
};
```

For testing, pass a fake capability. For production, `main.ts` passes the real one from the runtime:

```typescript
// In a test: pass a fake
lookupCustomer((sql) => ({ id: `1`, name: `Test` }), customerId);

// In main.ts: pass the real one
lookupCustomer(query, customerId);
```

Plumbing functions (sequence, retry, error handling) are just functions like any other. They live in `functions/` and follow the same rules. Prefer variadic signatures to avoid deep nesting:

```typescript
// sequence.ts
export const sequence = (...steps: Array<() => Promise<void>>) => {
  return async () => {
    for (const step of steps) {
      await step();
    }
  };
};
```

Some functions return other functions. This is how a function can be configured with capabilities in `main.ts` and then called with data later by the runtime or by a pipeline:

```typescript
// sendReceipt.ts
import type { SendEmailFn } from "../types/SendEmailFn";
import type { OrderId } from "../types/OrderId";

export const sendReceipt = (sendEmail: SendEmailFn) => {
  return async (orderId: OrderId) => {
    await sendEmail(`Receipt for order ${orderId}`);
  };
};
```

In `main.ts`, `sendReceipt(sendEmail)` returns a function that only needs an `OrderId`. The capability is baked in.

## Step Files

Every file in `steps/`:

- Exports exactly one `const` arrow function
- File name matches export name exactly
- Has zero runtime imports from other project files (`import type` from `types/` is allowed)
- Receives leaf functions as parameters (same dependency injection as `functions/`)
- Takes a state type, destructures it, delegates to leaf functions, and merges results
- Contains only property access, function calls, and spread
- No `if`, no comparisons, no arithmetic, no string operations

If a step file needs computation, that computation belongs in a leaf function in `functions/`. This includes conditional updates. The leaf function receives the fields it needs to decide, and returns either the update or an empty object:

```typescript
// applyDamage.ts in functions/
export const applyDamage = (hp: HitPoints, damage: Damage, isAlive: IsAlive) =>
  isAlive ? { hp: (hp - damage) as HitPoints } : {};
```

The step file passes the fields without knowing what they mean:

```typescript
...applyDamage(state.hp, state.damage, state.isAlive)
```

```typescript
// stepCombat.ts
import type { GameState } from "../types/GameState";
import type { Damage } from "../types/Damage";
import type { ApplyDamageFn } from "../types/ApplyDamageFn";
import type { HealOverTimeFn } from "../types/HealOverTimeFn";

export const stepCombat = (
  applyDamage: ApplyDamageFn,
  healOverTime: HealOverTimeFn,
) => (state: GameState, damage: Damage): GameState => ({
  ...state,
  ...applyDamage(state.hp, damage),
  ...healOverTime(state.hp, state.regenRate),
});
```

## Type Files

Every file in `types/`:

- Exports exactly one type
- File name matches export name exactly

Use branded types instead of raw primitives. Never use bare `number`, `string`, or `boolean` as function parameters. Branded types prevent same-type parameter swaps: if a function takes `(amount: Amount, taxRate: TaxRate)`, swapping them is a compile error. With plain `number` it would be a silent bug.

```typescript
// Amount.ts
export type Amount = number & { readonly __brand: `Amount` };

// CustomerId.ts
export type CustomerId = string & { readonly __brand: `CustomerId` };
```

State types use a `__state` marker so the validation script can distinguish them from branded primitives. Only step files in `steps/` may take state types as parameters:

```typescript
// GameState.ts
import type { HitPoints } from "./HitPoints";
import type { RegenRate } from "./RegenRate";

export type GameState = {
  readonly __state: true;
  hp: HitPoints;
  regenRate: RegenRate;
};
```

Raw values from external boundaries (API responses, user input, configuration) are cast to branded types at the point of entry, in runtime adapters. Functions never see unbranded values.

## Runtime

Each file in `runtime/` is an adapter that wraps one external service and exports one capability. Adapters are thin wrappers with no business logic. They only import from `node_modules`, never from `functions/`, `types/`, or other project files.

```typescript
// runtime/database.ts
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const query = (sql: string) => pool.query(sql);
```

Runtime adapters translate interfaces, nothing else. They convert between an external service's API and a signature that functions can call. If a runtime file contains an `if` that branches on application data, a loop over data, a calculation, or a transformation beyond what's needed to call the service, that logic belongs in `functions/`.

`main.ts` imports capabilities directly from `runtime/`. There is no intermediate assembly file.

For stateful applications (UI, simulations, games), a runtime adapter runs a loop:

1. Hold the current state
2. Call a pure function with the state to produce new state
3. Call a pure function with the state to produce a render description
4. Handle input events by calling a pure function with state + event to produce new state
5. Repeat

The loop is a dumb driver. It passes state through pure functions without inspecting, transforming, or branching on it. All decisions about what the state means happen inside the pure functions. The loop only knows how to call them and when.

```typescript
// For a simulation, the runtime calls these in a loop:
// stepSimulation(state, deltaTime) => newState
// renderState(state) => renderDescription
// handleInput(state, event) => newState
```

## State

Most programs do not need state. A CLI tool, a request-response server, a data pipeline, these take input, produce output, and are done. Only use state when the program must remember something that changes over time and cannot be cheaply recomputed.

State holds only values that cannot be derived from other state. If a value can be computed from other fields, it is a function in `functions/`, not a field. `isLowHealth` is not state, it is `(hp: HitPoints, threshold: HitPoints) => hp < threshold`.

State is defined as a type in `types/`, following the same one-export-per-file rule. State transitions return new state, no mutation.

Functions in `functions/` never take a state type. They take individual fields as branded types and return only the fields they change:

```typescript
// applyDamage.ts in functions/
import type { HitPoints } from "../types/HitPoints";
import type { Damage } from "../types/Damage";

export const applyDamage = (hp: HitPoints, damage: Damage) =>
  ({ hp: (hp - damage) as HitPoints });
```

Step files in `steps/` bridge state and functions. See the Step Files section for rules and examples.

## main.ts

`main.ts` is the wiring. It imports every function and every runtime capability, then connects them in a single expression tree. No variables, no logic, no branching.

- Contains only import statements and one expression tree
- No variable declarations (`const`, `let`, `var`)
- No logic, no branching, no assignments
- Grows vertically (more lines), not horizontally (more nesting)
- The expression tree ends with `()` to start execution

The nesting of the expression tree IS the architecture. What's nested inside what shows how functions are composed.

```typescript
import { query } from "./runtime/database";
import { sendEmail } from "./runtime/email";
import { sequence } from "./functions/sequence";
import { authPipeline } from "./functions/authPipeline";
import { authenticateUser } from "./functions/authenticateUser";
import { billingPipeline } from "./functions/billingPipeline";
import { calculateTax } from "./functions/calculateTax";
import { lookupCustomer } from "./functions/lookupCustomer";
import { sendReceipt } from "./functions/sendReceipt";

sequence(
  authPipeline(authenticateUser(query)),
  billingPipeline(calculateTax, lookupCustomer(query)),
  sendReceipt(sendEmail),
)();
```

Functions that need capabilities are configured here: `lookupCustomer(query)` returns a function with the database query baked in. Pipeline functions receive these configured functions and compose them. The `()` at the end starts everything.

For a stateful application, `main.ts` wires the loop adapter with step functions and leaf functions:

```typescript
import { runLoop } from "./runtime/gameLoop";
import { stepCombat } from "./steps/stepCombat";
import { applyDamage } from "./functions/applyDamage";
import { healOverTime } from "./functions/healOverTime";
import { renderState } from "./functions/renderState";
import { handleInput } from "./functions/handleInput";

runLoop(
  stepCombat(applyDamage, healOverTime),
  renderState,
  handleInput,
)();
```

## Duplication

No duplicated logic. If two functions need the same logic, extract it into a shared function and pass it as a parameter. More wiring in `main.ts` is preferable to duplicated code.

## Error Handling

Throw exceptions for errors. The runtime catches at the top level. Functions do not wrap return values in result types. Functions that cannot fail and functions that rarely fail look the same, they return values directly.

## Async

Functions are async when they receive or call an async capability (database, network, etc.). Pure computation functions that do not perform I/O are synchronous. The function's return type makes this explicit: `Promise<T>` for async, `T` for sync.

## Testing

Functions are tested by calling them with inputs and inspecting outputs. No framework magic required. Pass fake capabilities to isolate from I/O:

```typescript
// testing lookupCustomer
const fakeQuery = (sql: string) => ({ id: `1`, name: `Test` });
const result = lookupCustomer(fakeQuery, `1` as CustomerId);
// inspect result directly
```

Test files live in `tests/`. File names should match the function being tested.

## Dependencies

All dependencies are passed as parameters. This includes:

- Other functions
- Node built-ins (crypto, fs, etc.)
- npm packages
- I/O capabilities (database, network, email)

No runtime imports from other project files, except in `main.ts`. `import type` from `types/` is allowed anywhere.

The reason: runtime imports create hidden coupling. A function that imports another function is secretly dependent on it. That dependency is invisible from the outside, makes testing harder, and means an agent has to trace import chains to understand behavior. Passing dependencies as parameters keeps everything visible.

## Validation

A validation script in `scripts/` enforces these rules mechanically and runs as a pre-commit hook. The script is outside the system it enforces. It may import freely and use the TypeScript compiler API:

- Each file in `functions/`, `steps/`, and `types/` exports exactly one thing
- No runtime imports from other project files in `functions/` or `steps/` (`import type` from `types/` is allowed)
- File name matches export name
- No `function` keyword (except in type signatures)
- All top-level declarations are `const`
- `main.ts` has no variable declarations
- Direct function parameters use branded types, not raw primitives (callback signatures inside type definitions are exempt)
- Functions in `functions/` never take a state type (`__state: true`) as a parameter
- Step files in `steps/` contain only property access, function calls, and spread; no computation
- Runtime files only import from `node_modules`, never from project code
- Runtime adapters should contain no business logic (not mechanically enforced, but flagged in code review)

Code that breaks a rule is rejected before it enters the codebase. The agent doesn't need to remember the rules. The validation script remembers them.
