// Settings Popup for ReScript

open Pixi
open PixiUI

// App version (will be defined via Vite)
@val external appVersion: string = "APP_VERSION"

// Create the settings popup
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
  let panelBase = RoundedBox.make(~options={height: 425.0}, ())
  let _ = Container.addChild(panel, panelBase.container)

  // Title
  let title = Label.make(~text="Settings", ~style={fill: 0xec1561, fontSize: 50}, ())
  Text.setY(title, -.panelBase.boxHeight *. 0.5 +. 60.0)
  let _ = Container.addChildText(panel, title)

  // Done button
  let doneButton = Button.make(~options={text: "OK"}, ())
  FancyButton.setY(doneButton, panelBase.boxHeight *. 0.5 -. 78.0)
  Signal.connect(FancyButton.onPress(doneButton), () => {
    switch GetEngine.get() {
    | Some(engine) => let _ = Navigation.dismissPopup(engine.navigation)
    | None => ()
    }
  })
  let _ = Container.addChild(panel, FancyButton.toContainer(doneButton))

  // Version label
  let versionLabel = Label.make(~text=`Version ${appVersion}`, ~style={fill: 0xffffff, fontSize: 12}, ())
  Text.setAlpha(versionLabel, 0.5)
  Text.setY(versionLabel, panelBase.boxHeight *. 0.5 -. 15.0)
  let _ = Container.addChildText(panel, versionLabel)

  // Layout for sliders
  let layout = List.make({"type": "vertical", "elementsMargin": 4})
  List.setX(layout, -140.0)
  List.setY(layout, -80.0)
  let _ = Container.addChild(panel, List.toContainer(layout))

  // Master slider
  let masterSlider = VolumeSlider.make(~label="Master Volume", ())
  Signal.connect(Slider.onUpdate(masterSlider.slider), v => {
    UserSettings.setMasterVolume(v /. 100.0)
  })
  let _ = List.addChild(layout, Slider.toContainer(masterSlider.slider))

  // BGM slider
  let bgmSlider = VolumeSlider.make(~label="BGM Volume", ())
  Signal.connect(Slider.onUpdate(bgmSlider.slider), v => {
    UserSettings.setBgmVolume(v /. 100.0)
  })
  let _ = List.addChild(layout, Slider.toContainer(bgmSlider.slider))

  // SFX slider
  let sfxSlider = VolumeSlider.make(~label="SFX Volume", ())
  Signal.connect(Slider.onUpdate(sfxSlider.slider), v => {
    UserSettings.setSfxVolume(v /. 100.0)
  })
  let _ = List.addChild(layout, Slider.toContainer(sfxSlider.slider))

  {
    container,
    prepare: Some(() => {
      Slider.setValue(masterSlider.slider, UserSettings.getMasterVolume() *. 100.0)
      Slider.setValue(bgmSlider.slider, UserSettings.getBgmVolume() *. 100.0)
      Slider.setValue(sfxSlider.slider, UserSettings.getSfxVolume() *. 100.0)
    }),
    show: Some(async () => {
      switch GetEngine.get() {
      | Some(engine) =>
        switch engine.navigation.currentScreen {
        | Some(screen) =>
          let blurFilter = BlurFilter.make({"strength": 4})
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
