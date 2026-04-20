#!/usr/bin/env ruby

require 'xcodeproj'

# Open the Xcode project
project_path = 'LaneShadow.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the main target and test target
main_target = project.targets.find { |t| t.name == 'LaneShadow' }
test_target = project.targets.find { |t| t.name == 'LaneShadowTests' }

# Get the LaneShadow group (main app group)
laneshadow_group = project.main_group['LaneShadow']

# Add Avatar.swift to main target (if not already there)
avatar_path = 'LaneShadow/Views/Atoms/Avatar.swift'
avatar_file = laneshadow_group.find_file_by_path(avatar_path)
if avatar_file.nil?
  avatar_file = laneshadow_group.new_file(avatar_path)
  sources_phase = main_target.build_phases.find { |phase| phase.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase) }
  sources_phase.add_file_reference(avatar_file)
  puts "Successfully added Avatar.swift to main target"
else
  puts "Avatar.swift already exists in main target"
end

# Get the LaneShadowTests group
tests_group = project.main_group['LaneShadowTests']

# Add AvatarTests.swift to test target
test_path = 'LaneShadowTests/Components/UI/Atoms/AvatarTests.swift'
test_file = tests_group.find_file_by_path(test_path)
if test_file.nil?
  test_file = tests_group.new_file(test_path)
  test_sources_phase = test_target.build_phases.find { |phase| phase.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase) }
  test_sources_phase.add_file_reference(test_file)
  puts "Successfully added AvatarTests.swift to test target"
else
  puts "AvatarTests.swift already exists in test target"
end

# Save the project
project.save
