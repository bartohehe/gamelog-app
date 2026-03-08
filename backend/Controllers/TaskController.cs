using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CloudBackend.Data;
using CloudBackend.Models;
namespace CloudBackend.Controllers;
[ApiController]
[Route("api/[controller]")] // Adres: http://localhost:8081/api/tasks
public class TasksController : ControllerBase
{
private readonly AppDbContext_context;
// Wstrzykiwanie zależności(Dependency Injection) kontekstu bazy danych
public TasksController(AppDbContextcontext)
{
_context = context;
}
[HttpGet] // 1. Lista (READ ALL)
public async Task<ActionResult> GetAll()
{
return Ok(await _context.Tasks.ToListAsync());
}
[HttpGet("{id}")] // 2. Szczegóły(READ ONE)
public async Task<ActionResult> GetById(int id)
{
var task = await _context.Tasks.FindAsync(id);
return task == null ? NotFound() : Ok(task);
}
 
[HttpPost] // 3. Dodaj(CREATE)
public async Task<ActionResult> Create(CloudTasktask)
{
_context.Tasks.Add(task);
await _context.SaveChangesAsync();
// Zwracastatus 201 Created oraz lokalizację nowego zasobu
return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
}
[HttpPut("{id}")] // 4. Edytuj(UPDATE)
public async Task<ActionResult> Update(int id, CloudTasktask)
{
if (id != task.Id) return BadRequest("ID mismatch");  
_context.Entry(task).State = EntityState.Modified;
await _context.SaveChangesAsync();
return NoContent(); // Status 204 - operacja udana, brak danych do odesłania
}
[HttpDelete("{id}")] // 5. Usuń(DELETE)
public async Task<ActionResult> Delete(int id)
{
var task = await _context.Tasks.FindAsync(id);
if (task == null) return NotFound();
_context.Tasks.Remove(task);
await _context.SaveChangesAsync();
return NoContent();
}
}