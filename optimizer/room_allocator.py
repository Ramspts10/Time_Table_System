"""
Specialized Room Allocator and Efficiency Scoring Engine.
"""
from typing import List, Dict, Any, Optional
from optimizer.variables import SchedulingProblemData, RoomData, SessionToSchedule


class RoomAllocator:
    """
    Evaluates room matching efficiency and optimizes room assignments for scheduled sessions.
    """
    def compute_room_score(self, session: SessionToSchedule, room: RoomData, student_count: int) -> float:
        if room.capacity < student_count:
            return -1000.0  # Invalid

        score = 100.0

        # Capacity wastage penalty (prefer room close to student count)
        waste = room.capacity - student_count
        score -= waste * 1.5

        # Room type match
        if session.requires_lab:
            if "LAB" in room.room_type.upper():
                score += 50.0
            else:
                return -1000.0
        elif session.required_room_type and session.required_room_type != "ANY":
            if session.required_room_type.upper() in room.room_type.upper():
                score += 30.0

        # Equipment match bonus
        if session.required_equipment:
            match_count = sum(1 for eq in session.required_equipment if eq in room.equipment)
            score += match_count * 15.0

        # Preferred rooms
        if room.id in session.preferred_rooms if hasattr(session, "preferred_rooms") else False:
            score += 25.0

        return score

    def rank_compatible_rooms(self, session: SessionToSchedule, rooms: List[RoomData], student_count: int) -> List[Dict[str, Any]]:
        ranked = []
        for room in rooms:
            score = self.compute_room_score(session, room, student_count)
            if score > -500.0:
                ranked.append({
                    "room_id": room.id,
                    "room_name": room.name,
                    "capacity": room.capacity,
                    "student_count": student_count,
                    "capacity_waste": room.capacity - student_count,
                    "score": round(score, 2),
                    "room_type": room.room_type,
                    "equipment": room.equipment
                })
        ranked.sort(key=lambda r: r["score"], reverse=True)
        return ranked
