from manim import *
import numpy as np

class WindowSweep(Animation):
    def __init__(self, tracker, window_group, start_idx, end_idx, window_target_fn, on_step, **kwargs):
        self.window_group = window_group
        self.start_idx = int(start_idx)
        self.end_idx = int(end_idx)
        self.window_target_fn = window_target_fn
        self.on_step = on_step
        self.last_idx = self.start_idx - 1
        super().__init__(tracker, **kwargs)

    def interpolate_mobject(self, mobject, alpha):
        idx = int(round(self.start_idx + alpha * (self.end_idx - self.start_idx)))
        lo, hi = min(self.start_idx, self.end_idx), max(self.start_idx, self.end_idx)
        idx = max(lo, min(hi, idx))
        mobject.set_value(idx)
        self.window_group.move_to(self.window_target_fn(idx))
        if self.end_idx >= self.start_idx and idx > self.last_idx:
            for k in range(self.last_idx + 1, idx + 1):
                self.on_step(k)
            self.last_idx = idx

class Scene6(Scene):
    def construct(self):
        AUDIO_DURATION = 28.680
        elapsed = 0.0
        self.camera.background_color = "#0E1116"
        PRIMARY = "#58C4DD"
        cell = 0.30
        input_cells = VGroup(*[Square(0.2) for _ in range(48)])
        v_cells = VGroup(*[Square(0.2) for _ in range(35)])
        h_cells = VGroup(*[Square(0.2) for _ in range(35)])
        self.play(FadeIn(input_cells, lag_ratio=0.08), run_time=1.7)
        self.play(FadeIn(v_cells, lag_ratio=0.06), FadeIn(h_cells, lag_ratio=0.06), run_time=1.4)
