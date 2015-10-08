# meteor-private-bench

How do the (unchanged) contents of `private/*` affect rebuild times in
Meteor 1.2?

See [SUMMARY.md](SUMMARY.md) for summary details, or individial [logs](logs)
from the last run (with `METEOR_PROFILE=50`).

To reproduce, with any node version with ES6 support:

1. npm i
1. Optionally: `rm -rf site && meteor create site`
1. npm run bench
