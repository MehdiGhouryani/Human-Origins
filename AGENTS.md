# Agent entry point

1. Read `docs/IMPLEMENTATION-PLAN.md` completely before touching code. It is the only plan.
2. Work on exactly one task (`T<phase>.<n>`) at a time, in the order the status board gives. Do not start a task whose dependencies are not `DONE`.
3. A task is done only when its acceptance checks pass **and** `npm run qa:release` exits 0.
4. After every task, update the plan in the same change: status board, task status, snapshot numbers, changelog (see "Update protocol").
5. Never invent scientific facts, dates, DOIs or licences. Unverified items stay `NEEDS-REVIEW`.
