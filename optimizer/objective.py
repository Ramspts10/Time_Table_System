"""
Objective Function Builder for CP-SAT Model.
"""
from typing import List
from ortools.sat.python import cp_model
from optimizer.variables import OptimizationVariables, SchedulingProblemData
from optimizer.soft_constraints import build_soft_penalties


def setup_objective(model: cp_model.CpModel, vars_ctx: OptimizationVariables, problem: SchedulingProblemData):
    penalties = build_soft_penalties(model, vars_ctx, problem)
    if penalties:
        model.Minimize(sum(penalties))
    else:
        model.Minimize(0)
