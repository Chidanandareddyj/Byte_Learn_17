from manim import *
import numpy as np

class Scene7(Scene):
    def construct(self):
        AUDIO_DURATION = 29.920
        elapsed = 0.0
        self.camera.background_color = "#0E1116"

        PRIMARY = "#58C4DD"
        SECONDARY = "#83C167"
        ACCENT = "#FFFF00"

        cell_size = 0.42
        input_vals = np.array([
            [1, 2, 0, 1],
            [0, 3, 1, 2],
            [2, 1, 4, 0],
            [1, 0, 2, 3],
        ], dtype=float)
        patch_r, patch_c = 1, 1
        IN_ROWS, IN_COLS = input_vals.shape
        OUT_ROWS, OUT_COLS = 3, 3

        def cell_at(grid, row, col, n_cols):
            return grid[row * n_cols + col]

        def cell_color(v):
            t = np.clip(abs(v) / 4.0, 0.0, 1.0)
            base = ManimColor(PRIMARY)
            return base.interpolate(BLACK, 1.0 - 0.55 * t)

        def build_grid(values, anchor, scale=1.0):
            rows, cols = values.shape
            cells = VGroup()
            for i in range(rows):
                for j in range(cols):
                    sq = Square(
                        side_length=cell_size * scale,
                        stroke_color=WHITE,
                        stroke_width=1.4,
                        fill_color=cell_color(values[i, j]),
                        fill_opacity=0.72,
                    )
                    sq.move_to(
                        anchor
                        + RIGHT * (j - (cols - 1) / 2) * cell_size * scale
                        + UP * ((rows - 1) / 2 - i) * cell_size * scale
                    )
                    sq.value = values[i, j]
                    sq.grid_pos = (i, j)
                    cells.add(sq)
            return cells

        input_anchor = LEFT * 4.6 + DOWN * 0.15
        output_anchor = RIGHT * 3.8 + DOWN * 0.15

        input_grid = build_grid(input_vals, input_anchor)
        output_vals = np.array([
            [2, -1, 1],
            [0, 3, -2],
            [1, 0, 2],
        ], dtype=float)
        output_grid = build_grid(output_vals, output_anchor, scale=0.95)

        window_cells = VGroup(
            *[
                cell_at(input_grid, patch_r + dr, patch_c + dc, IN_COLS)
                for dr in range(2)
                for dc in range(2)
            ]
        )
        window_frame = SurroundingRectangle(
            window_cells,
            color=PRIMARY,
            buff=0.04,
            stroke_width=3.2,
            corner_radius=0.05,
        )

        out_r, out_c = 1, 1
        bright_cell = cell_at(output_grid, out_r, out_c, OUT_COLS)
        bright_cell.set_fill(SECONDARY, opacity=0.95)
        bright_cell.set_stroke(ACCENT, width=2.8)

        bar_w, bar_gap = 0.38, 0.52
        bar_origin = DOWN * 0.35
        signed_weights = [1, -1, 1, -1]
        patch_values = [
            input_vals[patch_r + dr][patch_c + dc] for dr in range(2) for dc in range(2)
        ]
        weighted = [sv * pv for sv, pv in zip(signed_weights, patch_values)]
        bar_heights = [0.35 + 0.22 * abs(w) for w in weighted]
        bar_signs = [1 if w >= 0 else -1 for w in weighted]

        bars = VGroup()
        bar_faces = VGroup()
        for k in range(4):
            h = bar_heights[k]
            rect = Rectangle(
                width=bar_w,
                height=h,
                fill_color=PRIMARY if bar_signs[k] > 0 else RED_E,
                fill_opacity=0.85,
                stroke_color=WHITE,
                stroke_width=1.2,
            )
            rect.move_to(
                bar_origin
                + RIGHT * ((k % 2) - 0.5) * bar_gap
                + UP * ((1 - k // 2) - 0.5) * bar_gap
                + UP * bar_signs[k] * h / 2
            )
            bars.add(rect)
            face = Rectangle(
                width=bar_w,
                height=h,
                fill_color=SECONDARY,
                fill_opacity=0.92,
                stroke_color=WHITE,
                stroke_width=1.2,
            )
            face.move_to(rect.get_center())
            num = MathTex(
                f"+{signed_weights[k]}" if signed_weights[k] > 0 else str(signed_weights[k]),
                font_size=28,
                color=SECONDARY,
            )
            num.move_to(face.get_center())
            face_group = VGroup(face, num)
            face_group.set_opacity(0)
            bar_faces.add(face_group)

        corr_lines = VGroup()
        for k, src in enumerate(window_cells):
            tgt = bars[k]
            line = Line(
                src.get_center(),
                tgt.get_center(),
                color=PRIMARY,
                stroke_width=2.0,
                stroke_opacity=0.85,
            )
            corr_lines.add(line)

        total_h = sum(abs(w) for w in weighted) * 0.08 + 0.55
        total_bar = Rectangle(
            width=0.55,
            height=total_h,
            fill_color=ACCENT,
            fill_opacity=0.9,
            stroke_color=WHITE,
            stroke_width=1.4,
        )
        total_bar.move_to(RIGHT * 1.55 + DOWN * 0.35 + UP * total_h / 2)
        total_brace = Brace(total_bar, direction=RIGHT, buff=0.12, color=ACCENT)
        total_label = MathTex(r"+\,3", font_size=30, color=ACCENT)
        total_label.next_to(total_brace, RIGHT, buff=0.12)

        kernel_cells = VGroup()
        kernel_nums_data = [[1, -1], [1, -1]]
        kernel_anchor = RIGHT * 0.15 + UP * 2.05
        for i in range(2):
            for j in range(2):
                ksq = Square(
                    side_length=0.46,
                    stroke_color=SECONDARY,
                    stroke_width=2.0,
                    fill_color=SECONDARY,
                    fill_opacity=0.18,
                )
                ksq.move_to(
                    kernel_anchor
                    + RIGHT * (j - 0.5) * 0.52
                    + UP * (0.5 - i) * 0.52
                )
                kn = MathTex(
                    "+1" if kernel_nums_data[i][j] > 0 else "-1",
                    font_size=26,
                    color=SECONDARY,
                )
                kn.move_to(ksq.get_center())
                kernel_cells.add(VGroup(ksq, kn))
        kernel_group = VGroup(*kernel_cells)
        kernel_label = Tex(r"kernel", font_size=24, color=SECONDARY)
        kernel_label.next_to(kernel_group, UP, buff=0.14)

        star_icon = VGroup(
            Circle(radius=0.18, color=ACCENT, stroke_width=2.2, fill_opacity=0.15),
            MathTex(r"\ast", font_size=30, color=ACCENT),
        )
        star_icon.move_to((input_grid.get_center() + output_grid.get_center()) / 2 + UP * 0.05)

        heading = MathTex(
            r"\text{output}",
            r"=",
            r"\text{input}",
            r"\circledast",
            r"\text{kernel}",
            font_size=34,
        )
        heading[0].set_color(ACCENT)
        heading[2].set_color(PRIMARY)
        heading[4].set_color(SECONDARY)
        heading[3].set_color(ACCENT)
        heading.to_edge(UP, buff=0.28)
        heading.set_opacity(0)

        glow_ring = Circle(
            radius=0.34,
            stroke_color=ACCENT,
            stroke_width=2.4,
            fill_opacity=0.0,
        ).move_to(bright_cell.get_center())

        stage = VGroup(
            input_grid,
            output_grid,
            window_frame,
            bars,
            corr_lines,
            total_bar,
            total_brace,
            total_label,
            star_icon,
        )
        zoom_anchor = bright_cell.get_center() + LEFT * 1.0 + UP * 0.25
        zoom_factor = 1.28

        self.play(
            LaggedStart(
                *[FadeIn(c, scale=0.6) for c in input_grid],
                lag_ratio=0.06,
            ),
            FadeIn(window_frame),
            lag_ratio=0.15,
            run_time=1.6,
        )
        elapsed += 1.6

        self.play(
            LaggedStart(
                *[FadeIn(c, scale=0.6) for c in output_grid],
                lag_ratio=0.08,
            ),
            run_time=1.4,
        )
        elapsed += 1.4

        self.play(
            Indicate(bright_cell, color=ACCENT, scale_factor=1.15),
            stage.animate.scale(zoom_factor, about_point=zoom_anchor),
            run_time=2.2,
            rate_func=smooth,
        )
        elapsed += 2.2

        patch_copy = VGroup(
            *[
                Square(
                    side_length=cell_size * 0.95,
                    stroke_color=ACCENT,
                    stroke_width=2.0,
                    fill_color=cell_color(input_vals[patch_r + dr][patch_c + dc]),
                    fill_opacity=0.85,
                ).move_to(window_cells[dr * 2 + dc].get_center())
                for dr in range(2)
                for dc in range(2)
            ]
        )
        patch_frame = SurroundingRectangle(patch_copy, color=ACCENT, buff=0.05, stroke_width=2.6)
        magnifier = VGroup(patch_copy, patch_frame)
        magnifier.scale(1.35).next_to(bright_cell, LEFT, buff=0.55)
        stage.add(magnifier)

        self.play(
            TransformFromCopy(window_cells, patch_copy),
            Create(patch_frame),
            magnifier.animate.scale(1.08),
            run_time=2.0,
            rate_func=smooth,
        )
        elapsed += 2.0

        self.play(
            LaggedStart(*[Create(l) for l in corr_lines], lag_ratio=0.18),
            LaggedStart(*[GrowFromCenter(b) for b in bars], lag_ratio=0.15),
            run_time=2.4,
            rate_func=smooth,
        )
        elapsed += 2.4

        self.play(
            GrowFromEdge(total_bar, DOWN),
            GrowFromCenter(total_brace),
            FadeIn(total_label, shift=RIGHT * 0.15),
            bright_cell.animate.set_fill(ACCENT, opacity=0.95),
            run_time=2.6,
            rate_func=smooth,
        )
        elapsed += 2.6

        match_line = DashedLine(
            total_bar.get_top(),
            bright_cell.get_bottom() + DOWN * 0.08,
            color=ACCENT,
            stroke_width=2.5,
            dash_length=0.08,
        )
        stage.add(match_line)
        self.play(Create(match_line), run_time=0.9, rate_func=smooth)
        elapsed += 0.9

        self.play(
            total_bar.animate.stretch_to_fit_height(bright_cell.height * 1.05, about_edge=DOWN),
            total_label.animate.set_color(ACCENT),
            Circumscribe(VGroup(total_bar, bright_cell), color=ACCENT, fade_out=True),
            run_time=2.2,
            rate_func=smooth,
        )
        elapsed += 2.2

        flip_anims = []
        for bar, face in zip(bars, bar_faces):
            flip_anims.append(ReplacementTransform(bar, face))
        self.play(
            AnimationGroup(*flip_anims, lag_ratio=0.12),
            run_time=2.4,
            rate_func=smooth,
        )
        elapsed += 2.4

        weight_tiles = bar_faces
        stage.add(kernel_group, kernel_label, glow_ring)

        self.play(
            FadeIn(kernel_group, shift=DOWN * 0.2),
            FadeIn(kernel_label, shift=DOWN * 0.1),
            FadeIn(glow_ring),
            heading.animate.set_opacity(1),
            run_time=2.3,
            rate_func=smooth,
        )
        elapsed += 2.3

        self.play(
            Flash(star_icon, color=ACCENT, line_length=0.18, num_lines=10),
            Indicate(kernel_group, color=SECONDARY),
            Indicate(weight_tiles, color=PRIMARY),
            run_time=1.8,
            rate_func=smooth,
        )
        elapsed += 1.8

        rep1_box = SurroundingRectangle(
            VGroup(input_grid, window_frame, weight_tiles, corr_lines, magnifier),
            color=PRIMARY,
            buff=0.22,
            stroke_width=1.6,
            corner_radius=0.08,
        )
        rep2_box = SurroundingRectangle(
            VGroup(output_grid, kernel_group, total_bar),
            color=SECONDARY,
            buff=0.22,
            stroke_width=1.6,
            corner_radius=0.08,
        )
        rep1_tag = Tex(r"bars", font_size=22, color=PRIMARY)
        rep1_tag.next_to(rep1_box, DOWN, buff=0.08)
        rep2_tag = Tex(r"grid", font_size=22, color=SECONDARY)
        rep2_tag.next_to(rep2_box, DOWN, buff=0.08)
        stage.add(rep1_box, rep2_box, rep1_tag, rep2_tag)

        self.play(
            FadeIn(rep1_box),
            FadeIn(rep2_box),
            FadeIn(rep1_tag),
            FadeIn(rep2_tag),
            run_time=1.5,
            rate_func=smooth,
        )
        elapsed += 1.5

        remaining = AUDIO_DURATION - elapsed
        if remaining > 1.5:
            sweep = max(2.0, remaining - 0.45)
        else:
            sweep = max(0.5, remaining - 0.3)

        t1 = sweep * 0.28
        t2 = sweep * 0.24
        t3 = sweep * 0.24
        t4 = sweep - t1 - t2 - t3

        self.play(
            stage.animate.scale(1.0 / zoom_factor, about_point=zoom_anchor),
            run_time=t1,
            rate_func=smooth,
        )
        elapsed += t1

        self.play(
            glow_ring.animate.scale(1.14),
            Indicate(kernel_group, color=SECONDARY, scale_factor=1.05),
            corr_lines.animate.set_stroke(opacity=1.0),
            run_time=t2,
            rate_func=smooth,
        )
        elapsed += t2

        self.play(
            glow_ring.animate.scale(1.0 / 1.14),
            Indicate(weight_tiles, color=PRIMARY, scale_factor=1.04),
            Flash(star_icon, color=ACCENT, line_length=0.16, num_lines=8),
            run_time=t3,
            rate_func=smooth,
        )
        elapsed += t3

        self.play(
            glow_ring.animate.scale(1.1),
            bright_cell.animate.set_stroke(width=3.6),
            total_bar.animate.set_fill(opacity=1.0),
            run_time=t4,
            rate_func=there_and_back,
        )
        elapsed += t4

        self.wait(max(0.1, min(1.0, AUDIO_DURATION - elapsed)))
