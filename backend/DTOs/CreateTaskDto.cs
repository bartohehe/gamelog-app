namespace CloudBackend.DTOs;
public class TaskCreateDto
{
    public string Name { get; set; } = string.Empty;
    // Nie potrzebujemy Id, bo nada je baza danych
}