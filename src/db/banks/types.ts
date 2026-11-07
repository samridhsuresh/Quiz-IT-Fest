import type { CategorySlug, DifficultyLevel } from '../../utils/quizLogic.ts';

export type DiagramType =
  | 'none'
  | 'cpu_pipeline'
  | 'cache_hierarchy'
  | 'motherboard_bus'
  | 'network_osi'
  | 'storage_nvme'
  | 'engine_four_stroke'
  | 'turbocharger_flow'
  | 'transmission_gears'
  | 'differential_torque'
  | 'suspension_wishbone'
  | 'moto_desmodromic'
  | 'moto_chain_drive'
  | 'moto_carburetor_venturi'
  | 'moto_swingarm_anti_squat'
  | 'moto_radial_brake'
  | 'geo_coord_projection'
  | 'geo_airport_runway'
  | 'geo_great_circle'
  | 'geo_tectonic_subduction'
  | 'geo_jet_stream'
  | 'prog_binary_tree'
  | 'prog_memory_stack_heap'
  | 'prog_event_loop'
  | 'prog_hash_table'
  | 'prog_dijkstra_graph';

export interface SeedQuestionItem {
  code: string;
  categorySlug: CategorySlug;
  difficulty: DifficultyLevel;
  questionText: string;
  options: [string, string, string, string]; // First option is the canonical correct answer before shuffling
  explanation: string;
  diagramType: DiagramType;
  diagramCaption?: string;
  tags: string[];
  estimatedTimeSec: number;
}
