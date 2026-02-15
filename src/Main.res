// Main entry point for ReScript

// Side-effect import for @pixi/sound (triggers plugin registration)
let _ = PixiSound.sound

// Side-effect imports for location screens (triggers registry registration)
let _ = FieldScreen.constructor
let _ = CityScreen.constructor
let _ = LabScreen.constructor
let _ = AtlasScreen.constructor
let _ = NexusScreen.constructor
let _ = DevHubScreen.constructor
let _ = RuralISPScreen.constructor
let _ = BusinessISPScreen.constructor
let _ = RegionalISPScreen.constructor
let _ = BackboneScreen.constructor

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

  // Show the world map screen (location selection)
  log("Showing world map screen...")
  await Navigation.showScreen(engine.navigation, WorldMapScreen.constructor)
  log("World map screen shown")
}

// Start the application with error handling
let _ = {
  log("Main.res loading...")
  startApp()->Promise.catch(e => {
    logError(e)
    Promise.resolve()
  })
}
