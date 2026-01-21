// Pause Popup for ReScript

open Pixi
open PixiUI

// Create the pause popup
let make = (): Navigation.appScreen => {
  let container = Container.make()

  // Background
  let bg = Sprite.make({"texture": Texture.white, "anchor": 0.0})
  Sprite.setTint(bg, 0x0)
  Sprite.setInteractive(bg, true)
  let _ = Container.addChildSprite(container, bg)

  // Panel container
  let panel = Container.make()
  let _ = Container.addChild(container, panel)

  // Panel base
  let panelBase = RoundedBox.make(~options={height: 300.0}, ())
  let _ = Container.addChild(panel, panelBase.container)

  // Title
  let title = Label.make(~text="Paused", ~style={fill: 0xec1561, fontSize: 50}, ())
  Text.setY(title, -80.0)
  let _ = Container.addChildText(panel, title)

  // Done button
  let doneButton = Button.make(~options={text: "Resume"}, ())
  FancyButton.setY(doneButton, 70.0)
  Signal.connect(FancyButton.onPress(doneButton), () => {
    switch GetEngine.get() {
    | Some(engine) => let _ = Navigation.dismissPopup(engine.navigation)
    | None => ()
    }
  })
  let _ = Container.addChild(panel, FancyButton.toContainer(doneButton))

  {
    container,
    prepare: None,
    show: Some(async () => {
      switch GetEngine.get() {
      | Some(engine) =>
        switch engine.navigation.currentScreen {
        | Some(screen) =>
          let blurFilter = BlurFilter.make({"strength": 5})
          Container.setFilters(screen.container, [BlurFilter.toFilter(blurFilter)])
        | None => ()
        }
      | None => ()
      }

      Sprite.setAlpha(bg, 0.0)
      ObservablePoint.setY(Container.pivot(panel), -400.0)
      let _ = Motion.animate(bg, {"alpha": 0.8}, {duration: 0.2, ease: "linear"})
      await Motion.animateAsync(Container.pivot(panel), {"y": 0.0}, {duration: 0.3, ease: "backOut"})
    }),
    hide: Some(async () => {
      switch GetEngine.get() {
      | Some(engine) =>
        switch engine.navigation.currentScreen {
        | Some(screen) => Container.setFilters(screen.container, [])
        | None => ()
        }
      | None => ()
      }

      let _ = Motion.animate(bg, {"alpha": 0.0}, {duration: 0.2, ease: "linear"})
      await Motion.animateAsync(Container.pivot(panel), {"y": -500.0}, {duration: 0.3, ease: "backIn"})
    }),
    pause: None,
    resume: None,
    reset: None,
    update: None,
    resize: Some((width, height) => {
      Sprite.setWidth(bg, width)
      Sprite.setHeight(bg, height)
      Container.setX(panel, width *. 0.5)
      Container.setY(panel, height *. 0.5)
    }),
    blur: None,
    focus: None,
    onLoad: None,
  }
}

// Screen constructor
let constructor: Navigation.appScreenConstructor = {
  make,
  assetBundles: None,
}
