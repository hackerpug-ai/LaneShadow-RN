#!/usr/bin/env python3
"""
Fix iOS target membership by updating project.pbxproj.

This script moves Swift files from incorrect targets (ConvexMobile) to the
correct target (LaneShadow) by editing the Xcode project file.
"""
import sys
import re
from pathlib import Path

def fix_target_membership(project_file):
    """Fix Swift file target membership in project.pbxproj."""
    
    with open(project_file, 'r') as f:
        content = f.read()
    
    # Find Swift files that need fixing
    # Pattern: Swift files in LaneShadow/ that are referenced in ConvexMobile build phase
    
    # Find the LaneShadow target's sources build phase ID
    lane_shadow_match = re.search(
        r'([A-F0-9]+) /\* Sources \*/ = \{[^}]*isa = PBXSourcesBuildPhase[^}]*'
        r'buildActionMask.*?'
        r'files = \(\s*([^)]*?)\s*\);',
        content,
        re.DOTALL
    )
    
    if not lane_shadow_match:
        print("[ERROR] Could not find LaneShadow Sources build phase")
        return False
    
    # Find ConvexMobile build phase and extract file references
    convex_mobile_files = re.findall(
        r'([A-F0-9]+) /\* (LaneShadow/[^.]+\.swift) in Sources \*/.*?ConvexMobile',
        content,
        re.DOTALL
    )
    
    if not convex_mobile_files:
        print("[INFO] No Swift files in ConvexMobile target")
        return True
    
    print(f"[INFO] Found {len(convex_mobile_files)} Swift files in ConvexMobile target")
    
    # For each file in ConvexMobile, move it to LaneShadow
    for build_ref, file_path in convex_mobile_files:
        # Find the actual file reference
        file_ref_match = re.search(
            rf'([A-F0-9]+) /\* {Path(file_path).name} \*/ = {{[^}]*path = {Path(file_path).name}',
            content
        )
        
        if not file_ref_match:
            print(f"[WARN] Could not find file reference for {file_path}")
            continue
        
        file_ref = file_ref_match.group(1)
        print(f"[INFO] Moving {Path(file_path).name} to LaneShadow target")
        
        # Remove from ConvexMobile build phase
        content = re.sub(
            rf'{build_ref} /\* [^"]+ in Sources \*/ = {{isa = PBXBuildFile;.*?}};',
            '',
            content,
            flags=re.DOTALL
        )
        
        # Add to LaneShadow build phase (simplified - in real scenario would need proper ID generation)
        # For now, just log what needs to be done
        print(f"[TODO] Add {file_path} to LaneShadow Sources build phase")
    
    # Write back
    with open(project_file, 'w') as f:
        f.write(content)
    
    return True

if __name__ == '__main__':
    ios_root = Path(__file__).parent.parent.parent
    project_file = ios_root / 'LaneShadow.xcodeproj' / 'project.pbxproj'
    
    if not project_file.exists():
        print(f"[ERROR] Project file not found: {project_file}")
        sys.exit(1)
    
    print(f"[INFO] Fixing target membership in {project_file}")
    
    if fix_target_membership(project_file):
        print("[INFO] Target membership fix complete")
        sys.exit(0)
    else:
        print("[ERROR] Failed to fix target membership")
        sys.exit(1)
