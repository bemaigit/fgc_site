import React from 'react';
import {
  Box,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/lab';
import type { Competition } from '../config/types';

interface CompetitionManagerProps {
  competitions: Competition[];
  modalities: { id: string; name: string; }[];
  categories: { id: string; name: string; }[];
  onAdd: (competition: Partial<Competition>) => Promise<void>;
  onEdit: (id: string, competition: Partial<Competition>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CompetitionManager({
  competitions,
  modalities,
  categories,
  onAdd,
  onEdit,
  onDelete
}: CompetitionManagerProps) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<Competition>>({});

  const handleSave = async () => {
    try {
      if (form.id) {
        await onEdit(form.id, form);
      } else {
        await onAdd(form);
      }
      setOpen(false);
      setForm({});
    } catch (error) {
      console.error('Erro ao salvar competição:', error);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setForm({});
            setOpen(true);
          }}
        >
          Nova Competição
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Modalidade</TableCell>
              <TableCell>Categorias</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {competitions.map((competition) => (
              <TableRow key={competition.id}>
                <TableCell>{competition.name}</TableCell>
                <TableCell>
                  {new Date(competition.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {modalities.find(m => m.id === competition.modalityId)?.name}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {competition.categoryIds.map(categoryId => (
                      <Chip
                        key={categoryId}
                        label={categories.find(c => c.id === categoryId)?.name}
                        size="small"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<TrophyIcon />}
                    label={competition.status}
                    color={
                      competition.status === 'FINISHED'
                        ? 'success'
                        : competition.status === 'IN_PROGRESS'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setForm(competition);
                      setOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(competition.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {form.id ? 'Editar Competição' : 'Nova Competição'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Nome"
              fullWidth
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <DatePicker
              label="Data"
              value={form.date ? new Date(form.date) : null}
              onChange={(newValue) => setForm({
                ...form,
                date: newValue?.toISOString()
              })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
            
            <FormControl fullWidth>
              <InputLabel>Modalidade</InputLabel>
              <Select
                value={form.modalityId || ''}
                onChange={(e) => setForm({ ...form, modalityId: e.target.value })}
                label="Modalidade"
              >
                {modalities.map(modality => (
                  <MenuItem key={modality.id} value={modality.id}>
                    {modality.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Categorias</InputLabel>
              <Select
                multiple
                value={form.categoryIds || []}
                onChange={(e) => setForm({
                  ...form,
                  categoryIds: typeof e.target.value === 'string'
                    ? [e.target.value]
                    : e.target.value
                })}
                label="Categorias"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((categoryId) => (
                      <Chip
                        key={categoryId}
                        label={categories.find(c => c.id === categoryId)?.name}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {categories
                  .filter(category => !form.modalityId || category.modalityId === form.modalityId)
                  .map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status || 'SCHEDULED'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="SCHEDULED">Agendada</MenuItem>
                <MenuItem value="IN_PROGRESS">Em Andamento</MenuItem>
                <MenuItem value="FINISHED">Finalizada</MenuItem>
                <MenuItem value="CANCELLED">Cancelada</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={3}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
