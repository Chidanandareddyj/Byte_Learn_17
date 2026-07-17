from manim import *
import numpy as np

class Scene4(MovingCameraScene):
    def construct(self):
        AUDIO_DURATION = 33.600
        elapsed = 0.0
        self.camera.background_color = "#0E1116"
        PRIMARY = "#58C4DD"
        SECONDARY = "#83C167"
        ACCENT = "#FFFF00"
        NEG_TINT = "#FF5555"
        weights = np.array([1.0, 1.0, -1.0, -1.0])
        strip = np.array([0.55, 0.55, 0.55, 0.55, 0.85, 0.85, 0.15, 0.15, 0.85, 0.85, 0.55])
        window_stops = [0, 4, 6]
        cell = 0.52
        gap = 0.07
        strip_origin = LEFT * 2.65 + UP * 0.95
        prod_y = -0.15
        total_y = -1.85
        bar_scale = 1.35
        frame_w = 4 * (cell + gap) - gap + 0.2
        frame_h = cell + 0.2
        heading = Text("Sliding Window Convolution", font_size=34, color=WHITE)
        heading.to_edge(UP, buff=0.32)
        heading.set_y(3.1)
        def cell_center(local_i, win_idx):
            return strip_origin + RIGHT * ((win_idx + local_i) * (cell + gap) + cell / 2)
        def gray_color(v):
            return interpolate_color(ManimColor("#1A1F28"), ManimColor("#D8DCE3"), float(v))
        def window_pixels(idx):
            i = max(0, min(int(np.floor(idx)), len(strip) - 4))
            return strip[i: i + 4]
        def window_products(idx):
            return window_pixels(idx) * weights
        def window_sum(idx):
            return float(np.sum(window_products(idx)))
        bg_cells = VGroup()
        for i in range(len(strip)):
            sq = Square(side_length=cell, stroke_width=1.2, stroke_color=PRIMARY, fill_color=gray_color(strip[i]), fill_opacity=0.92)
            sq.move_to(strip_origin + RIGHT * (i * (cell + gap) + cell / 2))
            bg_cells.add(sq)
        grid_lines = VGroup()
        for i in range(len(strip) + 1):
            x = strip_origin[0] + i * (cell + gap) - gap / 2
            grid_lines.add(Line(np.array([x, strip_origin[1] - cell / 2 - 0.05, 0]), np.array([x, strip_origin[1] + cell / 2 + 0.05, 0]), stroke_width=0.8, color=PRIMARY, stroke_opacity=0.25))
        win_idx = ValueTracker(float(window_stops[0]))
        window_outline = RoundedRectangle(width=frame_w, height=frame_h, corner_radius=0.06, stroke_color=PRIMARY, stroke_width=3.2, fill_opacity=0.0)
        def update_window_outline(m):
            idx = int(win_idx.get_value())
            cx = np.mean([cell_center(i, idx)[0] for i in range(4)])
            m.move_to(np.array([cx, strip_origin[1], 0]))
        update_window_outline(window_outline)
        window_outline.add_updater(update_window_outline)
        weight_tiles = VGroup()
        weight_signs = VGroup()
        for i in range(4):
            tile = Square(side_length=0.34, fill_color=PRIMARY, fill_opacity=0.22, stroke_color=PRIMARY, stroke_width=2)
            sign = MathTex("+" if weights[i] > 0 else "-", font_size=34, color=WHITE)
            sign.move_to(tile.get_center())
            tile.add(sign)
            weight_tiles.add(tile)
            weight_signs.add(sign)
            def make_tile_updater(local_i):
                def updater(m):
                    idx = int(win_idx.get_value())
                    m.move_to(cell_center(local_i, idx) + UP * 0.72)
                return updater
            tile.add_updater(make_tile_updater(i))
        corr_lines = VGroup()
        for i in range(4):
            line = DashedLine(ORIGIN, UP, dash_length=0.06, color=PRIMARY, stroke_width=1.8, stroke_opacity=0.75)
            def make_line_updater(local_i):
                def updater(m):
                    idx = int(win_idx.get_value())
                    start = cell_center(local_i, idx) + DOWN * 0.34
                    end = np.array([cell_center(local_i, idx)[0], prod_y + 0.22, 0])
                    m.put_start_and_end_on(start, end)
                return updater
            line.add_updater(make_line_updater(i))
            corr_lines.add(line)
        product_rects = VGroup()
        for _ in range(4):
            product_rects.add(Rectangle(width=0.3, height=0.22, fill_opacity=0.85, stroke_width=1.4, stroke_color=WHITE, fill_color=SECONDARY))
        def update_product_rect(rect, local_i):
            idx = int(win_idx.get_value())
            px = float(window_pixels(idx)[local_i])
            val = float(window_products(idx)[local_i])
            w_bar = max(0.12, px * 0.95)
            h_bar = 0.18 + abs(val) * 0.22
            cx = cell_center(local_i, idx)[0]
            rect.set(width=w_bar, height=h_bar)
            if val >= 0:
                rect.set_fill(SECONDARY if weights[local_i] > 0 else PRIMARY)
                rect.move_to(np.array([cx, prod_y + h_bar / 2 + 0.05, 0]))
            else:
                rect.set_fill(NEG_TINT)
                rect.move_to(np.array([cx, prod_y - h_bar / 2 - 0.05, 0]))
        for i, rect in enumerate(product_rects):
            update_product_rect(rect, i)
        brace_left = Line(ORIGIN, DOWN * 0.15, color=PRIMARY, stroke_width=2.5)
        brace_right = Line(ORIGIN, DOWN * 0.15, color=PRIMARY, stroke_width=2.5)
        brace_base = Line(ORIGIN, RIGHT, color=PRIMARY, stroke_width=2.5)
        brace = VGroup(brace_left, brace_right, brace_base)
        def refresh_brace():
            idx = int(win_idx.get_value())
            left_x = cell_center(0, idx)[0] - 0.32
            right_x = cell_center(3, idx)[0] + 0.32
            y = prod_y - 0.38
            brace_left.put_start_and_end_on(np.array([left_x, y, 0]), np.array([left_x, y - 0.15, 0]))
            brace_right.put_start_and_end_on(np.array([right_x, y, 0]), np.array([right_x, y - 0.15, 0]))
            brace_base.put_start_and_end_on(np.array([left_x, y - 0.15, 0]), np.array([right_x, y - 0.15, 0]))
        refresh_brace()
        brace_sync = Dot(radius=0.001, fill_opacity=0, stroke_opacity=0)
        brace_sync.add_updater(lambda m: refresh_brace())
        total_rect = Rectangle(width=0.2, height=0.34, fill_color=ACCENT, fill_opacity=0.92, stroke_color=ACCENT, stroke_width=2.0)
        total_glow = RoundedRectangle(width=0.32, height=0.46, corner_radius=0.04, stroke_color=ACCENT, stroke_opacity=0.55, stroke_width=1.6, fill_opacity=0.0)
        total_group = VGroup(total_rect, total_glow)
        def update_total_rect(m):
            total = window_sum(win_idx.get_value())
            mag = min(2.8, abs(total) * bar_scale)
            h = 0.28 + mag * 0.12
            w = max(0.18, mag)
            tint = ACCENT if total >= 0 else NEG_TINT
            m.set(width=w, height=h)
            m.set_fill(tint)
            m.set_stroke(tint)
            if total >= 0:
                m.move_to(np.array([0, total_y + h / 2, 0]))
            else:
                m.move_to(np.array([0, total_y - h / 2, 0]))
            total_glow.set(width=w + 0.12, height=h + 0.12)
            total_glow.set_stroke(tint, opacity=0.55)
            total_glow.move_to(m)
        update_total_rect(total_rect)
        total_rect.add_updater(update_total_rect)
        sum_label = Text("sum of products", font_size=24, color=PRIMARY)
        sum_label.move_to(RIGHT * 3.15 + DOWN * 1.85)
        self.add(brace_sync)
        self.play(FadeIn(heading), Create(grid_lines), FadeIn(bg_cells), run_time=2.4, rate_func=smooth)
        elapsed += 2.4
        self.play(FadeIn(window_outline), LaggedStart(*[FadeIn(t, scale=0.6) for t in weight_tiles], lag_ratio=0.15), run_time=2.8, rate_func=smooth)
        elapsed += 2.8
        self.play(LaggedStart(*[Indicate(s, color=ACCENT, scale_factor=1.25) for s in weight_signs], lag_ratio=0.18), LaggedStart(*[FadeIn(l) for l in corr_lines], lag_ratio=0.12), run_time=2.6, rate_func=smooth)
        elapsed += 2.6
        self.add(product_rects, brace, total_group, sum_label)
        init_prods = window_products(win_idx.get_value())
        self.play(LaggedStart(*[GrowFromEdge(r, DOWN if init_prods[i] >= 0 else UP) for i, r in enumerate(product_rects)], lag_ratio=0.16), FadeIn(total_group), FadeIn(sum_label, shift=LEFT * 0.2), run_time=3.6, rate_func=smooth)
        elapsed += 3.6
        for i, rect in enumerate(product_rects):
            rect.add_updater(lambda m, i=i: update_product_rect(m, i))
        brace_sync.suspend_updating()
        self.play(Circumscribe(brace, color=PRIMARY, fade_out=True), run_time=1.4, rate_func=smooth)
        brace_sync.resume_updating()
        elapsed += 1.4
        merge_glow = Rectangle(width=2.4, height=0.42, fill_color=ACCENT, fill_opacity=0.0, stroke_color=ACCENT, stroke_width=2.0).move_to(np.array([0, total_y, 0]))
        merge_target = self._make_total_bar(window_sum(win_idx.get_value()), total_y, bar_scale, ACCENT, NEG_TINT)
        for rect in product_rects:
            rect.suspend_updating()
        total_rect.suspend_updating()
        self.play(AnimationGroup(LaggedStart(*[rect.animate.set_opacity(0.35).scale(0.85) for rect in product_rects], lag_ratio=0.08), Transform(merge_glow, merge_target, replace_mobject=True), Flash(total_rect, color=ACCENT, line_length=0.18, num_lines=14), lag_ratio=0.2), run_time=2.4, rate_func=smooth)
        for rect in product_rects:
            rect.resume_updating()
        total_rect.resume_updating()
        elapsed += 2.4
        self.remove(merge_glow)
        flat_label = Text("flat patch", font_size=22, color=PRIMARY)
        flat_label.add_updater(lambda m: m.next_to(window_outline, UP, buff=0.55))
        self.play(win_idx.animate.set_value(window_stops[0]), FadeIn(flat_label), run_time=2.8, rate_func=smooth)
        elapsed += 2.8
        total_rect.suspend_updating()
        self.play(Indicate(total_rect, color=ACCENT, scale_factor=1.05), run_time=1.2, rate_func=smooth)
        total_rect.resume_updating()
        elapsed += 1.2
        self.play(FadeOut(flat_label), run_time=0.5, rate_func=smooth)
        elapsed += 0.5
        pos_label = Text("dark to light", font_size=22, color=SECONDARY)
        pos_label.add_updater(lambda m: m.next_to(window_outline, UP, buff=0.55))
        cam_focus = np.array([0, total_y + 0.35, 0])
        self.play(win_idx.animate.set_value(window_stops[1]), FadeIn(pos_label), self.camera.frame.animate.set(width=9.5).move_to(cam_focus), run_time=3.6, rate_func=smooth)
        elapsed += 3.6
        total_rect.suspend_updating()
        self.play(Circumscribe(total_rect, color=ACCENT, fade_out=True), run_time=1.6, rate_func=smooth)
        total_rect.resume_updating()
        elapsed += 1.6
        self.play(FadeOut(pos_label), run_time=0.4, rate_func=smooth)
        elapsed += 0.4
        neg_label = Text("light to dark", font_size=22, color=NEG_TINT)
        neg_label.add_updater(lambda m: m.next_to(window_outline, UP, buff=0.55))
        self.play(win_idx.animate.set_value(window_stops[2]), FadeIn(neg_label), run_time=3.6, rate_func=smooth)
        elapsed += 3.6
        total_rect.suspend_updating()
        self.play(Circumscribe(total_rect, color=NEG_TINT, fade_out=True), Flash(total_rect, color=NEG_TINT, line_length=0.16, num_lines=10), run_time=1.6, rate_func=smooth)
        total_rect.resume_updating()
        elapsed += 1.6
        remaining = AUDIO_DURATION - elapsed
        if remaining > 1.5:
            sweep = remaining - 0.45
            self.play(win_idx.animate.set_value(float(window_stops[0])), self.camera.frame.animate.set(width=14.22).move_to(ORIGIN), FadeOut(neg_label), run_time=sweep, rate_func=linear)
            elapsed += sweep
        self.wait(max(0.1, min(1.0, AUDIO_DURATION - elapsed)))
    def _make_total_bar(self, total, y, scale, accent, neg_tint):
        mag = min(2.8, abs(total) * scale)
        h = 0.28 + mag * 0.12
        w = max(0.18, mag)
        bar = Rectangle(width=w, height=h, stroke_width=2.0, fill_opacity=0.92)
        tint = accent if total >= 0 else neg_tint
        bar.set_fill(tint)
        bar.set_stroke(tint)
        if total >= 0:
            bar.move_to(np.array([0, y + h / 2, 0]))
        else:
            bar.move_to(np.array([0, y - h / 2, 0]))
        glow = SurroundingRectangle(bar, buff=0.06, color=tint, stroke_opacity=0.55, stroke_width=1.6)
        return VGroup(bar, glow)
