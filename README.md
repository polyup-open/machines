The PolyUp-open project contains the data model and virtual machine used that can be used by learning platforms to present 3D scenes and math and computer science puzzles to users of the platform.

The Polyscript language which the virtual machine runs is a primarily functional, stack-oriented, block-based programming language with a reverse polish notation order of operations.

The PuzzleDefinitionJson data structure provides the means to turn a Polyscript program into a puzzle with a starting state, a solution, a list of blocks which the player can use to solve the puzzle, and metadata controlling which blocks from the starting state may be moved or changed.

The MachineInfo, MachineComponent, ComponentInfo, ComponentChip, and Chip data structures define the 3D scene in which the aforementioned puzzles are presented.

The MachineProgress, ComponentProgress, and ChipProgress data structures store a record of an individual user's work in the scene and puzzles.
