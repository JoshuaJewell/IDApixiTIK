// Main entry point for ReScript

// Side-effect import for @pixi/sound (triggers plugin registration)
let _ = PixiSound.sound

// Console log helper
let log: string => unit = %raw(`function(msg) { console.log(msg) }`)
let logError: exn => unit = %raw(`function(e) { console.error("Error:", e); if (e && e._1) console.error("Details:", e._1.message, e._1.stack) }`)

// Create and initialize the engine
let startApp = async (): unit => {
  log("Starting app...")
  // Create a new engine
  let engine = Engine.make()
  log("Engine created")
  GetEngine.set(engine)

  // Initialize the engine
  await Engine.init(
    engine,
    ~background="#1E1E1E",
    ~resizeOptions={
      minWidth: 768.0,
      minHeight: 1024.0,
      letterbox: false,
    },
  )
  log("Engine initialized")

  // Initialize user settings
  log("Initializing user settings...")
  UserSettings.init()
  log("User settings initialized")

  // Show the load screen
  log("Showing load screen...")
  await Navigation.showScreen(engine.navigation, LoadScreen.constructor)
  log("Load screen shown")

  // Show the world screen (physical world view with hacker character)
  log("Showing world screen...")
  await Navigation.showScreen(engine.navigation, WorldScreen.constructor)
  log("World screen shown")
}

// Start the application with error handling
let _ = {
  log("Main.res loading...")
  startApp()->Promise.catch(e => {
    logError(e)
    Promise.resolve()
  })
}
