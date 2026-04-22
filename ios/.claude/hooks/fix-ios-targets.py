#!/usr/bin/env python3
"""
Fix iOS target membership by moving Swift files from ConvexMobile to LaneShadow target.

This script directly edits the Xcode project.pbxproj file to move Swift files
from incorrect targets to the correct LaneShadow target.
"""

import re
import sys
from pathlib import Path

def main():
    ios_root = Path(__file__).parent.parent.parent
    project_file = ios_root / 'LaneShadow.xcodeproj' / 'project.pbxproj'
    
    if not project_file.exists():
        print(f"[ERROR] Project file not found: {project_file}")
        sys.exit(1)
    
    print(f"[INFO] Fixing target membership in {project_file}")
    
    with open(project_file, 'r') as f:
        content = f.read()
    
    # Files to fix: move from ConvexMobile to LaneShadow target
    files_to_fix = [
        'LSText.swift',
        'TypographyVariant.swift', 
        'PillSize.swift',
        'LSPill.swift'
    ]
    
    # Step 1: Find LaneShadow target's Sources build phase ID
    lane_shadow_phase_pattern = r'([A-F0-9]+) /\* Sources \*/ = \{[^}]*isa = PBXSourcesBuildPhase[^}]*buildActionMask.*?runOnlyForDeploymentPostprocessing = 0;'
    lane_shadow_phases = re.findall(lane_shadow_phase_pattern, content)
    
    if not lane_shadow_phases:
        print("[ERROR] Could not find LaneShadow Sources build phase")
        sys.exit(1)
    
    # Use the first Sources phase (typically the main app target)
    lane_shadow_sources_id = lane_shadow_phases[0]
    print(f"[INFO] LaneShadow Sources build phase: {lane_shadow_sources_id}")
    
    # Step 2: Find ConvexMobile's Sources build phase ID
    convex_phase_pattern = r'([A-F0-9]+) /\* Sources \*/ = \{[^}]*isa = PBXSourcesBuildPhase[^}]*buildActionMask.*?runOnlyForDeploymentPostprocessing = 0;'
    convex_phases = re.findall(convex_phase_pattern, content)
    
    # Step 3: Find which Sources phase belongs to ConvexMobile target
    convex_sources_id = None
    for phase_id in convex_phases:
        # Check if this phase is used by ConvexMobile target
        target_check = rf'{phase_id}.*?PBXNativeTarget.*?ConvexMobile'
        if re.search(target_check, content, re.DOTALL):
            convex_sources_id = phase_id
            break
    
    if convex_sources_id:
        print(f"[INFO] ConvexMobile Sources build phase: {convex_sources_id}")
    else:
        print("[WARN] Could not find ConvexMobile Sources build phase")
    
    # Step 4: For each file, move its build file reference from Convex to LaneShadow
    changes_made = 0
    
    for filename in files_to_fix:
        print(f"[INFO] Processing {filename}...")
        
        # Find the build file reference for this file
        build_file_pattern = rf'([A-F0-9]+) /\* {re.escape(filename)} in Sources \*/ = {{isa = PBXBuildFile;'
        build_file_match = re.search(build_file_pattern, content)
        
        if not build_file_match:
            print(f"[WARN] Could not find build file reference for {filename}")
            continue
        
        build_file_id = build_file_match.group(1)
        print(f"  Build file ID: {build_file_id}")
        
        # Check if this build file is in ConvexMobile's Sources phase
        if convex_sources_id:
            convex_pattern = rf'{convex_sources_id}.*?files = \([^)]*?{build_file_id}[^)]*?\)'
            if re.search(convex_pattern, content, re.DOTALL):
                print(f"  Found in ConvexMobile target - removing...")
                
                # Remove from ConvexMobile phase
                removal_pattern = rf'\s*{re.escape(build_file_id)} /\* [^"]+ in Sources \*/ = {{isa = PBXBuildFile;[^}}+}};.*?(?=\s*[A-F0-9]+ /\*|$)'
                content = re.sub(removal_pattern, '\n', content, flags=re.DOTALL)
                changes_made += 1
        
        # Add to LaneShadow's Sources phase
        # Find the LaneShadow Sources phase and add our file
        lane_shadow_pattern = rf'({lane_shadow_sources_id}) /\* Sources \*/ = {{'
        lane_shadow_match = re.search(lane_shadow_pattern, content)
        
        if lane_shadow_match:
            # Find where to insert: before the closing ');' of the files array
            lane_shadow_section_pattern = rf'{lane_shadow_sources_id} /\* Sources \*/ = {{[^}}*?files = \((.*?)\);'
            lane_shadow_section = re.search(lane_shadow_section_pattern, content, re.DOTALL)
            
            if lane_shadow_section:
                files_content = lane_shadow_section.group(1)
                
                # Check if file is already there
                if build_file_id not in files_content:
                    print(f"  Adding to LaneShadow target...")
                    
                    # Construct the new build file entry
                    # We need to copy the build file entry from wherever it currently is
                    build_file_entry_pattern = rf'{build_file_id} /\* {re.escape(filename)} in Sources \*/ = {{[^}}+}};'
                    build_file_entry = re.search(build_file_entry_pattern, content)
                    
                    if build_file_entry:
                        new_entry = f"\n\t\t\t{build_file_entry.group(0)}"
                        
                        # Insert before the closing );
                        new_files_content = files_content + new_entry + "\n\t\t"
                        content = content.replace(lane_shadow_section.group(0), 
                                               lane_shadow_section.group(0).replace(files_content, new_files_content))
                        changes_made += 1
                    else:
                        print(f"  [ERROR] Could not find build file entry for {filename}")
                else:
                    print(f"  Already in LaneShadow target")
    
    if changes_made == 0:
        print("[INFO] No changes needed")
        return
    
    # Step 5: Write the modified content back
    print(f"[INFO] Writing {changes_made} changes to project file...")
    
    # Create backup
    backup_file = project_file.with_suffix('.pbxproj.backup')
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"[INFO] Backup created: {backup_file}")
    
    with open(project_file, 'w') as f:
        f.write(content)
    
    print("[INFO] ✅ Target membership fixed!")
    print("[INFO] Please open Xcode to verify the changes")

if __name__ == '__main__':
    main()
