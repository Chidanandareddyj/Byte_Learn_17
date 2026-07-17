from manim import *
import numpy as np


class Scene6(MovingCameraScene):
    def construct(self):
        AUDIO_DURATION = 28.680
        elapsed = 0.0
        self.camera.background_color = "#0E1116"

        PRIMARY = "#58C4DD"
        SECONDARY = "#83C167"
        ACCENT = "#FFFF00"

        INPUT = np.full((6, 8), 0.74)
        INPUT[1:5, 2:6] = 0.20
        INPUT[2:4, 6] = 0.20
        INPUT[5, :] = 0.16

        ROWS, COLS = INPUT.shape
        WIN = 2
        OUT_R, OUT_C = ROWS - WIN + 1, COLS - WIN + 1

        def v_resp(r, c):
            left = INPUT[r, c] + INPUT[r + 1, c]
            right = INPUT[r, c + 1] + INPUT[r + 1, c + 1]
            return abs(right - left)

        def h_resp(r, c):
            top = INPUT[r, c] + INPUT[r, c + 1]
            bot = INPUT[r + 1, c] + INPUT[r + 1, c + 1]
            return abs(bot - top)

        V_MAP = np.zeros((OUT_R, OUT_C))
        H_MAP = np.zeros((OUT_R, OUT_C))
        for r in range(OUT_R):
            for c in range(OUT_C):
                V_MAP[r, c] = v_resp(r, c)
                H_MAP[r, c] = h_resp(r, c)

        v_max = max(float(V_MAP.max()), 0.001)
        h_max = max(float(H_MAP.max()), 0.001)

        positions = [(r, c) for r in range(OUT_R) for c in range(OUT_C)]
        edge_stops = []
        for idx, (r, c) in enumerate(positions):
            if V_MAP[r, c] / v_max > 0.55:
                edge_stops.append(idx)
            elif H_MAP[r, c] / h_max > 0.55:
                edge_stops.append(idx)
        edge_stops = edge_stops[:3]
        if len(edge_stops) < 3:
            edge_stops = [4, 12, 20]

        cell = 0.30
        input_origin = np.array([-5.05, 0.55, 0.0])

        def grid_center(r, c, origin, rows, cols):
            x = origin[0] + (c + cols / 2 - 0.5) * cell
            y = origin[1] + (rows / 2 - r - 0.5) * cell
            return np.array([x, y, 0.0])

        def window_target(idx):
            r, c = positions[min(max(int(idx), 0), len(positions) - 1)]
            return grid_center(r, c, input_origin, ROWS, COLS) + np.array(
                [cell / 2, -cell / 2, 0.0]
            )

        def resp_color(val, kind):
            t = float(np.clip(val, 0.0, 1.0))
            if kind == "v":
                base = interpolate_color(BLACK, ACCENT, t)
            else:
                base = interpolate_color(BLACK, SECONDARY, t)
            return interpolate_color(base, WHITE, 0.25 * t)

        heading = Text("Sliding Window Sweep", font_size=34, color=WHITE)
        heading.to_edge(UP, buff=0.35)
        heading.set_y(3.05)

        input_cells = VGroup()
        for r in range(ROWS):
            for c in range(COLS):
                sq = Square(side_length=cell * 0.92, stroke_width=1.0, stroke_color=GREY_D)
                gray = INPUT[r, c]
                sq.set_fill(color=interpolate_color(BLACK, WHITE, gray), opacity=1.0)
                sq.move_to(grid_center(r, c, input_origin, ROWS, COLS))
                input_cells.add(sq)

        input_label = Text("input grid", font_size=22, color=PRIMARY)
        input_label.next_to(input_cells, LEFT, buff=0.22)

        v_origin = np.array([1.55, 1.35, 0.0])
        h_origin = np.array([1.55, -1.05, 0.0])

        v_cells = VGroup()
        h_cells = VGroup()
        for r in range(OUT_R):
            for c in range(OUT_C):
                vsq = Square(side_length=cell * 0.88, stroke_width=0.8, stroke_color=GREY_E)
                vsq.set_fill(BLACK, opacity=0.85)
                vsq.move_to(grid_center(r, c, v_origin, OUT_R, OUT_C))
                v_cells.add(vsq)

                hsq = Square(side_length=cell * 0.88, stroke_width=0.8, stroke_color=GREY_E)
                hsq.set_fill(BLACK, opacity=0.85)
                hsq.move_to(grid_center(r, c, h_origin, OUT_R, OUT_C))
                h_cells.add(hsq)

        v_label = Text("vertical map", font_size=22, color=SECONDARY)
        v_label.next_to(v_cells, UP, buff=0.18)
        h_label = Text("horizontal map", font_size=22, color=SECONDARY)
        h_label.next_to(h_cells, DOWN, buff=0.18)
        out_label = Text("output map", font_size=22, color=ACCENT)
        out_group = VGroup(v_cells, h_cells)
        out_label.next_to(out_group, RIGHT, buff=0.25)

        pos_tracker = ValueTracker(0)
        last_filled = [-1]

        def deposit_cell(k):
            r, c = positions[k]
            vt = V_MAP[r, c] / v_max
            ht = H_MAP[r, c] / h_max
            v_cells[r * OUT_C + c].set_fill(
                resp_color(vt, "v"), opacity=0.35 + 0.65 * vt
            )
            h_cells[r * OUT_C + c].set_fill(
                resp_color(ht, "h"), opacity=0.35 + 0.65 * ht
            )

        def sync_outputs():
            idx = int(pos_tracker.get_value())
            if idx > last_filled[0]:
                for k in range(last_filled[0] + 1, idx + 1):
                    deposit_cell(k)
                last_filled[0] = idx

        window_body = DashedVMobject(
            Square(side_length=cell * WIN, color=PRIMARY, stroke_width=3.2),
            num_dashes=12,
        )
        window_label = Text("window", font_size=22, color=PRIMARY)
        window_label.next_to(window_body, UP, buff=0.08)
        window_group = VGroup(window_body, window_label)
        window_group.move_to(window_target(0))

        def move_window(_):
            window_group.move_to(window_target(pos_tracker.get_value()))

        window_group.add_updater(move_window)

        trace_dots = VGroup()
        last_trace_idx = [-1]

        def update_trace(_):
            idx = int(pos_tracker.get_value())
            if idx > last_trace_idx[0]:
                dot = Dot(window_group.get_center(), radius=0.025, color=SECONDARY)
                dot.set_opacity(0.10)
                trace_dots.add(dot)
                last_trace_idx[0] = idx

        trace_dots.add_updater(update_trace)

        def tracker_updater(_):
            sync_outputs()

        pos_tracker.add_updater(tracker_updater)

        def build_product_panel(r, c, anchor):
            panel = VGroup()
            patches = VGroup()
            for dr in range(WIN):
                for dc in range(WIN):
                    p = Square(side_length=0.22, stroke_width=1.2, stroke_color=GREY_B)
                    p.set_fill(
                        interpolate_color(BLACK, WHITE, INPUT[r + dr, c + dc]),
                        opacity=1.0,
                    )
                    p.move_to(np.array([dc * 0.28, -dr * 0.28, 0.0]))
                    patches.add(p)
            patches.move_to(anchor + RIGHT * 1.05 + UP * 0.55)

            w_v = MathTex(r"-1", r"+1", r"-1", r"+1", font_size=28, color=PRIMARY)
            w_v.arrange(RIGHT, buff=0.18)
            w_v.next_to(patches, UP, buff=0.12)

            brace = Brace(patches, DOWN, buff=0.06, color=SECONDARY)
            total = DecimalNumber(v_resp(r, c), num_decimal_places=2, font_size=30, color=ACCENT)
            total.next_to(brace, DOWN, buff=0.08)
            eq = MathTex(r"\Sigma", font_size=30, color=ACCENT)
            eq.next_to(total, LEFT, buff=0.12)

            panel.add(patches, w_v, brace, eq, total)
            return panel

        self.add(trace_dots)
        self.play(
            FadeIn(heading, shift=0.12 * UP),
            LaggedStart(*[FadeIn(s, scale=0.85) for s in input_cells], lag_ratio=0.015),
            run_time=1.7,
        )
        elapsed += 1.7

        self.play(
            FadeIn(input_label),
            LaggedStart(*[Create(s) for s in v_cells], lag_ratio=0.01),
            LaggedStart(*[Create(s) for s in h_cells], lag_ratio=0.01),
            FadeIn(v_label, h_label, out_label),
            run_time=1.4,
        )
        elapsed += 1.4

        self.play(FadeIn(window_group), run_time=0.9)
        elapsed += 0.9

        self.play(Indicate(window_body, color=PRIMARY, scale_factor=1.05), run_time=0.7)
        elapsed += 0.7

        first_stop = edge_stops[0]
        self.play(
            pos_tracker.animate.set_value(first_stop),
            run_time=3.2,
            rate_func=smooth,
        )
        elapsed += 3.2

        r0, c0 = positions[first_stop]
        product_group = build_product_panel(r0, c0, window_group.get_center())
        self.play(FadeIn(product_group, shift=0.08 * UP), run_time=0.9)
        elapsed += 0.9
        self.play(Circumscribe(product_group[-1], color=ACCENT), run_time=0.7)
        elapsed += 0.7
        self.play(FadeOut(product_group), run_time=0.4)
        elapsed += 0.4

        mid_stop = edge_stops[1]
        self.play(
            pos_tracker.animate.set_value(mid_stop),
            run_time=3.4,
            rate_func=linear,
        )
        elapsed += 3.4

        r1, c1 = positions[mid_stop]
        product_group = build_product_panel(r1, c1, window_group.get_center())
        self.play(FadeIn(product_group), run_time=0.8)
        elapsed += 0.8
        self.play(
            Flash(product_group[-1], color=ACCENT, line_length=0.18, num_lines=10),
            run_time=0.6,
        )
        elapsed += 0.6
        self.play(FadeOut(product_group), run_time=0.35)
        elapsed += 0.35

        last_idx = len(positions) - 1
        self.play(
            pos_tracker.animate.set_value(last_idx),
            run_time=4.6,
            rate_func=linear,
        )
        elapsed += 4.6

        r2, c2 = positions[edge_stops[2]]
        product_group = build_product_panel(r2, c2, window_group.get_center())
        self.play(FadeIn(product_group), run_time=0.75)
        elapsed += 0.75
        self.play(FadeOut(product_group), run_time=0.35)
        elapsed += 0.35

        relief_v = VGroup()
        relief_h = VGroup()
        for r in range(OUT_R):
            for c in range(OUT_C):
                vt = V_MAP[r, c] / v_max
                ht = H_MAP[r, c] / h_max
                if vt > 0.08:
                    bar = Rectangle(
                        width=cell * 0.55,
                        height=0.08 + 0.22 * vt,
                        fill_color=resp_color(vt, "v"),
                        fill_opacity=0.9,
                        stroke_width=0,
                    )
                    bar.move_to(v_cells[r * OUT_C + c].get_center() + UP * (0.04 + 0.11 * vt))
                    relief_v.add(bar)
                if ht > 0.08:
                    bar = Rectangle(
                        width=cell * 0.55,
                        height=0.08 + 0.22 * ht,
                        fill_color=resp_color(ht, "h"),
                        fill_opacity=0.9,
                        stroke_width=0,
                    )
                    bar.move_to(h_cells[r * OUT_C + c].get_center() + UP * (0.04 + 0.11 * ht))
                    relief_h.add(bar)

        self.play(
            LaggedStart(*[GrowFromEdge(b, DOWN) for b in relief_v], lag_ratio=0.02),
            LaggedStart(*[GrowFromEdge(b, DOWN) for b in relief_h], lag_ratio=0.02),
            run_time=1.8,
        )
        elapsed += 1.8

        mug_outline = VGroup()
        for r in range(OUT_R):
            for c in range(OUT_C):
                if V_MAP[r, c] / v_max > 0.45:
                    dot = Dot(v_cells[r * OUT_C + c].get_center(), radius=0.05, color=ACCENT)
                    mug_outline.add(dot)
        table_outline = VGroup()
        for r in range(OUT_R):
            for c in range(OUT_C):
                if H_MAP[r, c] / h_max > 0.45:
                    dot = Dot(h_cells[r * OUT_C + c].get_center(), radius=0.05, color=SECONDARY)
                    table_outline.add(dot)

        self.play(
            ShowIncreasingSubsets(mug_outline),
            ShowIncreasingSubsets(table_outline),
            run_time=1.2,
        )
        elapsed += 1.2

        ghost = VGroup()
        for r in range(1, 5):
            for c in [2, 5]:
                e = Rectangle(
                    width=cell * 0.35,
                    height=cell * 0.92,
                    stroke_color=ACCENT,
                    stroke_width=2.5,
                    fill_opacity=0.0,
                )
                e.move_to(input_cells[r * COLS + c].get_center())
                ghost.add(e)
        ghost.set_opacity(0.55)
        stripe = mug_outline.copy()
        stripe.set_opacity(0.7)

        self.play(FadeIn(ghost), run_time=0.5)
        elapsed += 0.5
        self.play(
            ghost.animate.shift(RIGHT * 6.55),
            stripe.animate.set_color(ACCENT),
            run_time=1.1,
            rate_func=there_and_back_with_pause,
        )
        elapsed += 1.1
        self.play(FadeOut(ghost), run_time=0.4)
        elapsed += 0.4

        frame_center = (input_cells.get_center() + out_group.get_center()) / 2
        remaining = AUDIO_DURATION - elapsed
        zoom_time = max(2.0, remaining - 0.45) if remaining > 1.5 else 0.8
        self.play(
            self.camera.frame.animate.scale(1.14).move_to(frame_center + DOWN * 0.15),
            run_time=zoom_time,
            rate_func=smooth,
        )
        elapsed += zoom_time

        corr_lines = VGroup()
        for r in range(OUT_R):
            for c in range(OUT_C):
                if V_MAP[r, c] / v_max > 0.5:
                    start = input_cells[(min(r + 1, ROWS - 1)) * COLS + min(c + 1, COLS - 1)].get_center()
                    end = v_cells[r * OUT_C + c].get_center()
                    ln = Line(start, end, stroke_color=SECONDARY, stroke_width=1.2, stroke_opacity=0.35)
                    corr_lines.add(ln)
        if len(corr_lines) > 0:
            pulse_time = min(1.4, max(0.6, AUDIO_DURATION - elapsed - 0.35))
            if pulse_time > 0.2:
                self.play(
                    LaggedStart(*[Create(l) for l in corr_lines[:12]], lag_ratio=0.05),
                    run_time=pulse_time,
                    rate_func=smooth,
                )
                elapsed += pulse_time

        remaining = AUDIO_DURATION - elapsed
        if remaining > 1.5:
            sweep = remaining - 0.35
            glide = ValueTracker(0.0)

            def glide_updater(_):
                t = glide.get_value()
                idx = int(t * (len(positions) - 1))
                window_group.move_to(window_target(idx))

            window_group.remove_updater(move_window)
            window_group.add_updater(glide_updater)
            self.play(
                glide.animate.set_value(1.0),
                self.camera.frame.animate.shift(0.12 * RIGHT),
                run_time=sweep,
                rate_func=linear,
            )
            window_group.remove_updater(glide_updater)
            window_group.add_updater(move_window)
            elapsed += sweep

        pos_tracker.clear_updaters()
        sync_outputs()
        self.wait(max(0.1, min(1.0, AUDIO_DURATION - elapsed)))
