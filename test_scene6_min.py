from manim import *
import numpy as np

class TestEmptyTrace(Scene):
    def construct(self):
        trace_path = VMobject(stroke_color=RED, stroke_width=2)
        self.play(Create(trace_path), run_time=0.5)
        self.wait(0.1)
