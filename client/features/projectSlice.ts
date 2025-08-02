/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// ----------- Interfaces -----------
interface Project {
  project_id: string;
  company_id: string;
  project_name: string;
}

interface ProjectState {
  list: Project[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

interface AddProjectData {
  company_id: string;
  project_name: string;
}

// ----------- Async Thunks -----------
export const fetchProjects = createAsyncThunk<Project[], void>(
  "project/fetchProjects",
  async (_, { rejectWithValue }) => {
    const response = await axios.get("/api/v1/project/getProjects");

    if (response.status === 200) {
      return response.data?.data.Projects || [];
    }
    return rejectWithValue(
      response.data?.message || "Failed to fetch projects"
    );
  }
);

export const addProject = createAsyncThunk<
  { project: Project; message: string },
  AddProjectData
>("project/addProject", async (projectData) => {
  const response = await axios.post("/api/v1/project/addProject", projectData);
  if (response.status === 201) {
    return {
      project: response.data?.data.project,
      message: response.data?.message || "Project created successfully!",
    };
  }
  throw new Error(response.data?.message || "Failed to create project");
});

export const updateProject = createAsyncThunk<
  { project_id: string; project_name: string },
  { project_id: string; project_name: string }
>(
  "project/updateProject",
  async ({ project_id, project_name }, { rejectWithValue }) => {

    console.log(project_id, project_name);
    
    try {
      const response = await axios.patch(
        `/api/v1/project/updateProject/${project_id}`,
        { project_name }
      );

      if (response.status === 200) {
        return { project_id, project_name };
      }

      return rejectWithValue(
        response.data?.message || "Failed to update project"
      );
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating project"
      );
    }
  }
);

// ----------- Redux Slice -----------
const projectSlice = createSlice({
  name: "project",
  initialState: {
    list: [],
    status: "idle",
    error: null,
  } as ProjectState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
      })
      .addCase(
        fetchProjects.fulfilled,
        (state, action: PayloadAction<Project[]>) => {
          state.status = "succeeded";
          state.list = action.payload.filter(Boolean);
        }
      )
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to fetch projects";
      })
      .addCase(
        addProject.fulfilled,
        (
          state,
          action: PayloadAction<{ project: Project; message: string }>
        ) => {
          state.list.push(action.payload.project);
        }
      )
      .addCase(updateProject.fulfilled, (state, action) => {
        const { project_id, project_name } = action.payload;
        const existingProject = state.list.find(
          (p) => p.project_id === project_id
        );
        if (existingProject) {
          existingProject.project_name = project_name;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export default projectSlice.reducer;
