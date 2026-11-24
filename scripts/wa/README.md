# WA-style calculation drills

`src/data/review/waDrills.ts` is generated — change the inputs in `gen_wa.py`, then:

```bash
python scripts/wa/gen_wa.py . scripts/wa/.out      # writes waDrills.ts and .out/wa_spec.json
python scripts/wa/verify_wa.py scripts/wa/.out/wa_spec.json   # independent re-check (scikit-learn, SciPy, finite differences)
pnpm check:content
```

All numbers are original; no assignment text is reproduced.
