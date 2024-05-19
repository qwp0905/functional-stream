export interface HtmlEvent<T extends EventTarget> extends Event {
  target: T | null
}
export interface HtmlUIEvent<T extends EventTarget> extends UIEvent {
  target: T | null
}
export interface HtmlAnimationEvent<T extends EventTarget> extends AnimationEvent {
  target: T | null
}
export interface HtmlMouseEvent<T extends EventTarget> extends MouseEvent {
  target: T | null
}
export interface HtmlInputEvent<T extends EventTarget> extends InputEvent {
  target: T | null
}
export interface HtmlFocusEvent<T extends EventTarget> extends FocusEvent {
  target: T | null
}
export interface HtmlClipboardEvent<T extends EventTarget> extends ClipboardEvent {
  target: T | null
}
export interface HtmlDragEvent<T extends EventTarget> extends DragEvent {
  target: T | null
}
export interface HtmlCompositionEvent<T extends EventTarget> extends CompositionEvent {
  target: T | null
}
export interface HtmlErrorEvent<T extends EventTarget> extends ErrorEvent {
  target: T | null
}
export interface HtmlFormDataEvent<T extends EventTarget> extends FormDataEvent {
  target: T | null
}
export interface HtmlPointerEvent<T extends EventTarget> extends PointerEvent {
  target: T | null
}
export interface HtmlKeyboardEvent<T extends EventTarget> extends KeyboardEvent {
  target: T | null
}
export interface HtmlProgressEvent<T extends EventTarget> extends ProgressEvent {
  target: T | null
}
export interface HtmlSecurityPolicyViolationEvent<T extends EventTarget>
  extends SecurityPolicyViolationEvent {
  target: T | null
}
export interface HtmlSubmitEvent<T extends EventTarget> extends SubmitEvent {
  target: T | null
}
export interface HtmlTouchEvent<T extends EventTarget> extends TouchEvent {
  target: T | null
}
export interface HtmlTransitionEvent<T extends EventTarget> extends TransitionEvent {
  target: T | null
}
export interface HtmlWheelEvent<T extends EventTarget> extends WheelEvent {
  target: T | null
}

export interface HtmlEventMap<T extends EventTarget> {
  abort: HtmlUIEvent<T>
  animationcancel: HtmlAnimationEvent<T>
  animationend: HtmlAnimationEvent<T>
  animationiteration: HtmlAnimationEvent<T>
  animationstart: HtmlAnimationEvent<T>
  auxclick: HtmlMouseEvent<T>
  beforeinput: HtmlInputEvent<T>
  beforetoggle: HtmlEvent<T>
  blur: HtmlFocusEvent<T>
  cancel: HtmlEvent<T>
  canplay: HtmlEvent<T>
  canplaythrough: HtmlEvent<T>
  change: HtmlEvent<T>
  click: HtmlMouseEvent<T>
  close: HtmlEvent<T>
  compositionend: HtmlCompositionEvent<T>
  compositionstart: HtmlCompositionEvent<T>
  compositionupdate: HtmlCompositionEvent<T>
  contextmenu: HtmlMouseEvent<T>
  copy: HtmlClipboardEvent<T>
  cuechange: HtmlEvent<T>
  cut: HtmlClipboardEvent<T>
  dblclick: HtmlMouseEvent<T>
  drag: HtmlDragEvent<T>
  dragend: HtmlDragEvent<T>
  dragenter: HtmlDragEvent<T>
  dragleave: HtmlDragEvent<T>
  dragover: HtmlDragEvent<T>
  dragstart: HtmlDragEvent<T>
  drop: HtmlDragEvent<T>
  durationchange: HtmlEvent<T>
  emptied: HtmlEvent<T>
  ended: HtmlEvent<T>
  error: HtmlErrorEvent<T>
  focus: HtmlFocusEvent<T>
  focusin: HtmlFocusEvent<T>
  focusout: HtmlFocusEvent<T>
  formdata: HtmlFormDataEvent<T>
  gotpointercapture: HtmlPointerEvent<T>
  input: HtmlEvent<T>
  invalid: HtmlEvent<T>
  keydown: HtmlKeyboardEvent<T>
  keypress: HtmlKeyboardEvent<T>
  keyup: HtmlKeyboardEvent<T>
  load: HtmlEvent<T>
  loadeddata: HtmlEvent<T>
  loadedmetadata: HtmlEvent<T>
  loadstart: HtmlEvent<T>
  lostpointercapture: HtmlPointerEvent<T>
  mousedown: HtmlMouseEvent<T>
  mouseenter: HtmlMouseEvent<T>
  mouseleave: HtmlMouseEvent<T>
  mousemove: HtmlMouseEvent<T>
  mouseout: HtmlMouseEvent<T>
  mouseover: HtmlMouseEvent<T>
  mouseup: HtmlMouseEvent<T>
  paste: HtmlClipboardEvent<T>
  pause: HtmlEvent<T>
  play: HtmlEvent<T>
  playing: HtmlEvent<T>
  pointercancel: HtmlPointerEvent<T>
  pointerdown: HtmlPointerEvent<T>
  pointerenter: HtmlPointerEvent<T>
  pointerleave: HtmlPointerEvent<T>
  pointermove: HtmlPointerEvent<T>
  pointerout: HtmlPointerEvent<T>
  pointerover: HtmlPointerEvent<T>
  pointerup: HtmlPointerEvent<T>
  progress: HtmlProgressEvent<T>
  ratechange: HtmlEvent<T>
  reset: HtmlEvent<T>
  resize: HtmlUIEvent<T>
  scroll: HtmlEvent<T>
  scrollend: HtmlEvent<T>
  securitypolicyviolation: HtmlSecurityPolicyViolationEvent<T>
  seeked: HtmlEvent<T>
  seeking: HtmlEvent<T>
  select: HtmlEvent<T>
  selectionchange: HtmlEvent<T>
  selectstart: HtmlEvent<T>
  slotchange: HtmlEvent<T>
  stalled: HtmlEvent<T>
  submit: HtmlSubmitEvent<T>
  suspend: HtmlEvent<T>
  timeupdate: HtmlEvent<T>
  toggle: HtmlEvent<T>
  touchcancel: HtmlTouchEvent<T>
  touchend: HtmlTouchEvent<T>
  touchmove: HtmlTouchEvent<T>
  touchstart: HtmlTouchEvent<T>
  transitioncancel: HtmlTransitionEvent<T>
  transitionend: HtmlTransitionEvent<T>
  transitionrun: HtmlTransitionEvent<T>
  transitionstart: HtmlTransitionEvent<T>
  volumechange: HtmlEvent<T>
  waiting: HtmlEvent<T>
  webkitanimationend: HtmlEvent<T>
  webkitanimationiteration: HtmlEvent<T>
  webkitanimationstart: HtmlEvent<T>
  webkittransitionend: HtmlEvent<T>
  wheel: HtmlWheelEvent<T>
}
