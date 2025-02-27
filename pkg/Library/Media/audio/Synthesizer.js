/**
 * Copyright (c) 2022 Google LLC All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

export class Synthesizer {
  synthesize(text) {
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}
