// Resolution detection for ReScript

@val @scope("window") external devicePixelRatio: float = "devicePixelRatio"
@val @scope("Math") external max: (float, float) => float = "max"
@val @scope("Math") external floor: float => float = "floor"

let getResolution = (): float => {
  let resolution = max(devicePixelRatio, 2.0)

  // Check if resolution is an integer
  if mod_float(resolution, 1.0) != 0.0 {
    2.0
  } else {
    resolution
  }
}
