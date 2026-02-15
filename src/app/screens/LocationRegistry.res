// Location Registry - Breaks circular dependencies by using a registry pattern

type locationScreenConstructor = Navigation.appScreenConstructor

let registry: Dict.t<locationScreenConstructor> = Dict.make()

// Register a location screen
let register = (locationId: string, constructor: locationScreenConstructor): unit => {
  Dict.set(registry, locationId, constructor)
}

// Get a location screen constructor
let get = (locationId: string): option<locationScreenConstructor> => {
  Dict.get(registry, locationId)
}

// Navigate to a location
let navigateTo = (locationId: string): unit => {
  switch GetEngine.get() {
  | Some(engine) =>
    switch get(locationId) {
    | Some(constructor) => Navigation.showScreen(engine.navigation, constructor)->ignore
    | None => () // Location not found
    }
  | None => () // No engine
  }
}
