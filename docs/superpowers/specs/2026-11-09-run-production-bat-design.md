# Production Windows launcher design

## Goal

Add a Windows batch file that starts this Next.js app in production mode from
Command Prompt.

## Design

Add `run-production.bat` at the repository root. It switches the working
directory to the batch file's own directory, runs the existing `npm run build`
script, and only when that succeeds runs the existing `npm run start` script.
The app's configured production port is 3002.

If the build fails, the launcher reports the failure and waits for a keypress
before exiting with a non-zero status so the error remains visible. When the
server starts, it remains in the foreground in the same Command Prompt window;
the user can stop it with Ctrl+C.

Before starting the server, after a successful build, check whether any process
is listening on local port 3002. If so, terminate that process tree before
starting the app. This applies to any listener on that port, not only an
instance of this app. If the process cannot be terminated, report the error and
stop instead of continuing to start the server.

## Scope and validation

No application code, package scripts, dependencies, or runtime configuration
will change. Validate the batch file's command flow, including no listener,
listener terminated, and termination failure cases, then inspect the final
diff. Running the production build is environment-dependent and is not
required for this launcher-only change.
