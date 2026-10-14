"""Compatibility entry point for the native-clock, two-sheet interaction suite.

The previous shader-pulse check used virtual time and did not test capture or
CPU raycasting. Keep this entry point, but run the actual pointer acceptance.
"""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name('cloth-grab-smoke.py')), run_name='__main__')
