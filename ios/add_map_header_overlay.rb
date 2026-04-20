#!/usr/bin/env ruby

require 'xcodeproj'

# Open the Xcode project
project_path = 'LaneShadow.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the main target and test target
main_target = project.targets.find { |t| t.name == 'LaneShadow' }
test_target = project.targets.find { |t| t.name == 'LaneShadowTests' }

# Add MapHeaderOverlay.swift to main target
views_group = project.main_group['LaneShadow']['Views']
molecules_group = views_group['Molecules'] || views_group.new_group('Molecules')

map_header_overlay_path = 'LaneShadow/Views/Molecules/MapHeaderOverlay.swift'
map_header_overlay_file = molecules_group.find_file_by_path(map_header_overlay_path)
if map_header_overlay_file.nil?
  map_header_overlay_file = molecules_group.new_file(map_header_overlay_path)

  # Add to Sources build phase
  sources_phase = main_target.build_phases.find { |phase| phase.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase) }
  sources_phase.add_file_reference(map_header_overlay_file)
  puts "Added MapHeaderOverlay.swift to LaneShadow target"
end

# Add MapHeaderOverlayTests.swift to test target
tests_group = project.main_group['LaneShadowTests']
molecules_tests_group = tests_group['Molecules'] || tests_group.new_group('Molecules')

map_header_overlay_tests_path = 'LaneShadowTests/Molecules/MapHeaderOverlayTests.swift'
map_header_overlay_tests_file = molecules_tests_group.find_file_by_path(map_header_overlay_tests_path)
if map_header_overlay_tests_file.nil?
  map_header_overlay_tests_file = molecules_tests_group.new_file(map_header_overlay_tests_path)

  # Add to Sources build phase for test target
  test_sources_phase = test_target.build_phases.find { |phase| phase.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase) }
  test_sources_phase.add_file_reference(map_header_overlay_tests_file)
  puts "Added MapHeaderOverlayTests.swift to LaneShadowTests target"
end

# Save the project
project.save

puts "Successfully added MapHeaderOverlay files to the Xcode project"
