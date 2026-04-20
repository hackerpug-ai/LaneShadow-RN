#!/usr/bin/env ruby

require 'xcodeproj'

# Open the Xcode project
project_path = 'LaneShadow.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the main target
target = project.targets.find { |t| t.name == 'LaneShadow' }

# Find the Views group
views_group = project.main_group['LaneShadow']['Views']

# Find or create the Molecules group
molecules_group = views_group['Molecules'] || views_group.new_group('Molecules')

# Add LocationInput.swift
location_input_path = 'LaneShadow/Views/Molecules/LocationInput.swift'
location_input_file = molecules_group.find_file_by_path(location_input_path)
if location_input_file.nil?
  location_input_file = molecules_group.new_file(location_input_path)

  # Add file to the Sources build phase
  sources_phase = target.build_phases.find { |phase| phase.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase) }
  sources_phase.add_file_reference(location_input_file)

  puts "Successfully added LocationInput.swift to the Xcode project"
else
  puts "LocationInput.swift already exists in the Xcode project"
end

# Save the project
project.save
